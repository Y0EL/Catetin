import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai'
import { getDb } from '../db'
import { loadEnv } from '../env'
import { logger } from '../logger'
import {
  saveAgentTransaction,
  type AgentTransactionInput,
  type ChatSource,
  type RecordedChatTransaction,
} from './chat-transaction-service'
import { deleteTransaction, getMonthSummary, listTransactions } from './transaction-service'

const AGENT_MODEL = 'gemini-2.5-flash'
const MAX_TOOL_HOPS = 6
const HISTORY_CAP = 20

const CATEGORY_HINT =
  'makanan, minuman, transportasi, belanja, tagihan, hiburan, kesehatan, pendidikan, lainnya (pengeluaran), gaji, pemasukan lain (pemasukan)'

const SYSTEM_PROMPT = [
  'Kamu Catetin, asisten keuangan pribadi yang ngobrol santai kayak temen Gen-Z Indonesia.',
  'Gaya bahasa natural, hangat, to the point. Jangan kaku, jangan formal, jangan pernah pakai emoji.',
  '',
  'Tugas utama kamu bantu user nyatet keuangan dan jawab pertanyaan soal pengeluaran mereka.',
  '',
  'Aturan pakai tool.',
  '- Kalau user nyebut satu pengeluaran atau pemasukan lewat teks (misal "tadi jajan kopi 25rb"), langsung panggil catat_transaksi.',
  '- Kalau user kirim foto atau video struk, ekstrak semua yang kebaca lalu panggil ajukan_draft. JANGAN langsung catat_transaksi buat struk. Setelah itu ringkas isinya dan minta user balas buat konfirmasi.',
  '- Kalau user setuju nyimpen draft (misal balas "ya", "oke", "gas", "simpan"), panggil konfirmasi_draft.',
  '- Kalau user nanya ringkasan atau pengeluaran bulan ini, pakai lihat_ringkasan.',
  '- Kalau user nanya transaksi terakhir, pakai lihat_transaksi_terakhir.',
  '- Kalau user mau batalin atau hapus catatan terakhir, pakai hapus_transaksi_terakhir.',
  '',
  `Kategori yang valid: ${CATEGORY_HINT}. Pilih yang paling pas, kalau ragu pakai lainnya.`,
  'Jangan pernah ngarang angka. Kalau nominal gak jelas, tanya dulu ke user.',
  'Balasan singkat dan enak dibaca. Konfirmasi apa yang kamu catat biar user gampang ralat.',
].join('\n')

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'catat_transaksi',
    description: 'Simpan satu transaksi pengeluaran atau pemasukan ke catatan user.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        amount: { type: SchemaType.NUMBER, description: 'Nominal dalam rupiah, angka bulat.' },
        deskripsi: { type: SchemaType.STRING, description: 'Deskripsi singkat transaksi.' },
        kategori: { type: SchemaType.STRING, description: `Salah satu dari: ${CATEGORY_HINT}` },
        jenis: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['pengeluaran', 'pemasukan'],
          description: 'Jenis transaksi.',
        },
        tanggal: {
          type: SchemaType.STRING,
          description: 'Tanggal ISO opsional (YYYY-MM-DD). Kosongin kalau hari ini.',
        },
      },
      required: ['amount', 'deskripsi', 'kategori', 'jenis'],
    },
  },
  {
    name: 'ajukan_draft',
    description:
      'Ajukan draft transaksi dari hasil baca struk foto atau video. Tidak langsung disimpan, nunggu konfirmasi user.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        items: {
          type: SchemaType.ARRAY,
          description: 'Daftar transaksi yang kebaca dari struk.',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              amount: { type: SchemaType.NUMBER, description: 'Nominal rupiah.' },
              deskripsi: { type: SchemaType.STRING, description: 'Deskripsi item atau total.' },
              kategori: {
                type: SchemaType.STRING,
                description: `Salah satu dari: ${CATEGORY_HINT}`,
              },
              jenis: {
                type: SchemaType.STRING,
                format: 'enum',
                enum: ['pengeluaran', 'pemasukan'],
              },
            },
            required: ['amount', 'deskripsi', 'kategori', 'jenis'],
          },
        },
        merchant: { type: SchemaType.STRING, description: 'Nama toko atau merchant kalau ada.' },
      },
      required: ['items'],
    },
  },
  {
    name: 'konfirmasi_draft',
    description: 'Simpan semua transaksi dari draft yang sedang nunggu konfirmasi.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'lihat_ringkasan',
    description: 'Lihat ringkasan pemasukan, pengeluaran, dan kategori untuk satu bulan.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        bulan: {
          type: SchemaType.STRING,
          description: 'Bulan format YYYY-MM. Kosong = bulan ini.',
        },
      },
    },
  },
  {
    name: 'lihat_transaksi_terakhir',
    description: 'Lihat beberapa transaksi terakhir user.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        jumlah: { type: SchemaType.NUMBER, description: 'Berapa transaksi terakhir, default 5.' },
      },
    },
  },
  {
    name: 'hapus_transaksi_terakhir',
    description: 'Hapus transaksi yang paling terakhir dicatat user.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
]

type DraftItem = AgentTransactionInput
type PendingDraft = { items: DraftItem[]; merchant?: string; source: 'ocr_photo' | 'ocr_video' }

const histories = new Map<string, Content[]>()
const pendingDrafts = new Map<string, PendingDraft>()

let genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(loadEnv().GEMINI_API_KEY)
  return genAI
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function stripInlineData(history: Content[]): Content[] {
  const cleaned = history.map((c) => ({
    role: c.role,
    parts: c.parts.map((p): Part => ('inlineData' in p && p.inlineData ? { text: '[media]' } : p)),
  }))
  return cleaned.slice(-HISTORY_CAP)
}

export type AgentTurn = {
  conversationId: string
  userId: string
  channel: ChatSource
  parts: Part[]
  mediaKind?: 'photo' | 'video'
}

export async function runAgentTurn(turn: AgentTurn): Promise<string> {
  const db = getDb()
  const draftSource: PendingDraft['source'] = turn.mediaKind === 'video' ? 'ocr_video' : 'ocr_photo'

  async function execute(name: string, args: Record<string, unknown>): Promise<object> {
    switch (name) {
      case 'catat_transaksi': {
        const saved = await saveAgentTransaction(
          db,
          turn.userId,
          args as unknown as AgentTransactionInput,
          turn.channel,
        )
        return { ok: true, tersimpan: describeSaved(saved) }
      }
      case 'ajukan_draft': {
        const items = (args.items as DraftItem[] | undefined) ?? []
        if (items.length === 0) return { ok: false, alasan: 'gak ada item kebaca' }
        const draft: PendingDraft = { items, source: draftSource }
        if (typeof args.merchant === 'string' && args.merchant.length > 0) {
          draft.merchant = args.merchant
        }
        pendingDrafts.set(turn.conversationId, draft)
        return {
          ok: true,
          jumlah_item: items.length,
          total: items.reduce((sum, it) => sum + Math.round(it.amount), 0),
        }
      }
      case 'konfirmasi_draft': {
        const draft = pendingDrafts.get(turn.conversationId)
        if (!draft) return { ok: false, alasan: 'gak ada draft yang nunggu konfirmasi' }
        const saved: ReturnType<typeof describeSaved>[] = []
        for (const item of draft.items) {
          const row = await saveAgentTransaction(db, turn.userId, item, draft.source)
          saved.push(describeSaved(row))
        }
        pendingDrafts.delete(turn.conversationId)
        return { ok: true, tersimpan: saved }
      }
      case 'lihat_ringkasan': {
        const bulan = typeof args.bulan === 'string' && args.bulan ? args.bulan : currentMonth()
        const summary = await getMonthSummary(db, turn.userId, bulan)
        return { ok: true, ringkasan: summary }
      }
      case 'lihat_transaksi_terakhir': {
        const jumlah = typeof args.jumlah === 'number' ? Math.min(Math.max(args.jumlah, 1), 20) : 5
        const { rows } = await listTransactions(db, turn.userId, { limit: jumlah })
        return {
          ok: true,
          transaksi: rows.map((r) => ({
            deskripsi: r.description ?? r.merchant ?? 'Transaksi',
            jumlah: r.amount,
            jenis: r.kind === 'income' ? 'pemasukan' : 'pengeluaran',
            tanggal: r.occurredAt.toISOString().slice(0, 10),
          })),
        }
      }
      case 'hapus_transaksi_terakhir': {
        const { rows } = await listTransactions(db, turn.userId, { limit: 1 })
        const last = rows[0]
        if (!last) return { ok: false, alasan: 'belum ada transaksi' }
        await deleteTransaction(db, turn.userId, last.id)
        return {
          ok: true,
          dihapus: {
            deskripsi: last.description ?? last.merchant ?? 'Transaksi',
            jumlah: last.amount,
          },
        }
      }
      default:
        return { ok: false, alasan: 'tool gak dikenal' }
    }
  }

  const model = getGenAI().getGenerativeModel({
    model: AGENT_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations }],
  })

  const chat = model.startChat({ history: histories.get(turn.conversationId) ?? [] })

  try {
    let result = await chat.sendMessage(turn.parts)
    for (let hop = 0; hop < MAX_TOOL_HOPS; hop += 1) {
      const calls = result.response.functionCalls()
      if (!calls || calls.length === 0) break
      const responseParts: Part[] = []
      for (const call of calls) {
        const out = await execute(call.name, (call.args ?? {}) as Record<string, unknown>)
        responseParts.push({ functionResponse: { name: call.name, response: out } })
      }
      result = await chat.sendMessage(responseParts)
    }

    const text = result.response.text().trim()
    histories.set(turn.conversationId, stripInlineData(await chat.getHistory()))
    return text.length > 0 ? text : 'Oke, udah gue catat ya.'
  } catch (err) {
    logger.error({ err, conversationId: turn.conversationId }, 'gemini agent turn failed')
    throw err
  }
}

function describeSaved(saved: RecordedChatTransaction): {
  jenis: string
  jumlah: number
  deskripsi: string
  kategori: string
  wallet: string
} {
  return {
    jenis: saved.kind === 'income' ? 'pemasukan' : 'pengeluaran',
    jumlah: saved.amount,
    deskripsi: saved.description,
    kategori: saved.categoryName,
    wallet: saved.walletName,
  }
}
