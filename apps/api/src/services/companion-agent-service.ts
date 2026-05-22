import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai'
import { companionSystemPrompt } from '@catetin/prompts'
import { getDb } from '../db'
import { loadEnv } from '../env'
import { logger } from '../logger'
import {
  saveAgentTransaction,
  type AgentTransactionInput,
  type RecordedChatTransaction,
} from './chat-transaction-service'
import { deleteTransaction, getMonthSummary, listTransactions } from './transaction-service'

const COMPANION_MODEL = 'gemini-2.5-flash'
const MAX_TOOL_HOPS = 6
const HISTORY_CAP = 20

const CATEGORY_HINT =
  'makanan, minuman, transportasi, belanja, tagihan, hiburan, kesehatan, pendidikan, lainnya (pengeluaran), gaji, pemasukan lain (pemasukan)'

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'catat_transaksi',
    description: 'Simpan satu transaksi pengeluaran atau pemasukan dari ucapan user.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        amount: { type: SchemaType.NUMBER, description: 'Nominal rupiah, angka bulat.' },
        deskripsi: { type: SchemaType.STRING, description: 'Deskripsi singkat transaksi.' },
        kategori: { type: SchemaType.STRING, description: `Salah satu dari: ${CATEGORY_HINT}` },
        jenis: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['pengeluaran', 'pemasukan'],
        },
      },
      required: ['amount', 'deskripsi', 'kategori', 'jenis'],
    },
  },
  {
    name: 'lihat_ringkasan',
    description: 'Lihat ringkasan pemasukan, pengeluaran, dan kategori bulan tertentu.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        bulan: { type: SchemaType.STRING, description: 'Bulan YYYY-MM. Kosong = bulan ini.' },
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
    description: 'Hapus transaksi paling terakhir.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
]

const histories = new Map<string, Content[]>()

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
    parts: c.parts.map((p): Part => ('inlineData' in p && p.inlineData ? { text: '[audio]' } : p)),
  }))
  return cleaned.slice(-HISTORY_CAP)
}

export type CompanionTurnInput = {
  userId: string
  sessionId: string
  audio: { data: string; mimeType: string }
}

export type CompanionTurnResult = {
  text: string
}

export async function runCompanionTurn(turn: CompanionTurnInput): Promise<CompanionTurnResult> {
  const db = getDb()

  async function execute(name: string, args: Record<string, unknown>): Promise<object> {
    switch (name) {
      case 'catat_transaksi': {
        const saved = await saveAgentTransaction(
          db,
          turn.userId,
          args as unknown as AgentTransactionInput,
          'manual_chat',
        )
        return { ok: true, tersimpan: describeSaved(saved) }
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
    model: COMPANION_MODEL,
    systemInstruction: companionSystemPrompt,
    tools: [{ functionDeclarations }],
  })

  const chat = model.startChat({ history: histories.get(turn.sessionId) ?? [] })

  const parts: Part[] = [{ inlineData: { mimeType: turn.audio.mimeType, data: turn.audio.data } }]

  try {
    let result = await chat.sendMessage(parts)
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
    histories.set(turn.sessionId, stripInlineData(await chat.getHistory()))
    return { text: text.length > 0 ? text : 'Hmm gue gak nangkep, coba ulangin?' }
  } catch (err) {
    logger.error({ err, sessionId: turn.sessionId }, 'companion turn failed')
    throw err
  }
}

export function clearCompanionHistory(sessionId: string): void {
  histories.delete(sessionId)
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
