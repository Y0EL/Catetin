import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai'
import { GoogleGenAI } from '@google/genai'
import { companionSystemPrompt } from '@catetin/prompts'
import type { Database } from '@catetin/db'
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
const TTS_MODEL = 'gemini-3.1-flash-tts-preview'
const TTS_SAMPLE_RATE = 24000
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

const sessionHistories = new Map<string, Content[]>()

let genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(loadEnv().GEMINI_API_KEY)
  return genAI
}

let genAINew: GoogleGenAI | null = null
function getGenAINew(): GoogleGenAI {
  if (!genAINew) genAINew = new GoogleGenAI({ apiKey: loadEnv().GEMINI_API_KEY })
  return genAINew
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

function buildWavBuffer(pcm: Buffer): string {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = TTS_SAMPLE_RATE * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const dataSize = pcm.length
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(numChannels, 22)
  header.writeUInt32LE(TTS_SAMPLE_RATE, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)
  return Buffer.concat([header, pcm]).toString('base64')
}

export async function generateUmbrielTts(text: string): Promise<string> {
  const chunks: Buffer[] = []
  const stream = await getGenAINew().models.generateContentStream({
    model: TTS_MODEL,
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      responseModalities: ['audio'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Umbriel' } },
      },
    },
  })
  for await (const chunk of stream) {
    const data = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    if (data) chunks.push(Buffer.from(data, 'base64'))
  }
  if (chunks.length === 0) throw new Error('TTS returned no audio data')
  return buildWavBuffer(Buffer.concat(chunks))
}

async function runToolCall(
  db: Database,
  userId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<object> {
  switch (name) {
    case 'catat_transaksi': {
      const saved = await saveAgentTransaction(
        db,
        userId,
        args as unknown as AgentTransactionInput,
        'manual_chat',
      )
      return { ok: true, tersimpan: describeSaved(saved) }
    }
    case 'lihat_ringkasan': {
      const bulan = typeof args.bulan === 'string' && args.bulan ? args.bulan : currentMonth()
      const summary = await getMonthSummary(db, userId, bulan)
      return { ok: true, ringkasan: summary }
    }
    case 'lihat_transaksi_terakhir': {
      const jumlah = typeof args.jumlah === 'number' ? Math.min(Math.max(args.jumlah, 1), 20) : 5
      const { rows } = await listTransactions(db, userId, { limit: jumlah })
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
      const { rows } = await listTransactions(db, userId, { limit: 1 })
      const last = rows[0]
      if (!last) return { ok: false, alasan: 'belum ada transaksi' }
      await deleteTransaction(db, userId, last.id)
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

export type CompanionTurnInput = {
  userId: string
  sessionId: string
  audio: { data: string; mimeType: string }
}

export type CompanionTurnResult = {
  text: string
  transcript?: string
}

async function transcribeAudio(data: string, mimeType: string): Promise<string> {
  try {
    const model = getGenAI().getGenerativeModel({ model: COMPANION_MODEL })
    const result = await model.generateContent([
      {
        text: 'Transkripsi ucapan dalam audio berikut ke teks bahasa Indonesia. Balas hanya transkripsinya saja, tanpa tanda kutip atau penjelasan.',
      },
      { inlineData: { mimeType, data } },
    ])
    return result.response.text().trim()
  } catch {
    return ''
  }
}

export async function runCompanionTurn(turn: CompanionTurnInput): Promise<CompanionTurnResult> {
  const db = getDb()

  const model = getGenAI().getGenerativeModel({
    model: COMPANION_MODEL,
    systemInstruction: companionSystemPrompt,
    tools: [{ functionDeclarations }],
  })

  const chat = model.startChat({ history: sessionHistories.get(turn.sessionId) ?? [] })

  const parts: Part[] = [{ inlineData: { mimeType: turn.audio.mimeType, data: turn.audio.data } }]

  const transcriptPromise = transcribeAudio(turn.audio.data, turn.audio.mimeType)

  try {
    let result = await chat.sendMessage(parts)
    for (let hop = 0; hop < MAX_TOOL_HOPS; hop += 1) {
      const calls = result.response.functionCalls()
      if (!calls || calls.length === 0) break
      const responseParts: Part[] = []
      for (const call of calls) {
        const out = await runToolCall(
          db,
          turn.userId,
          call.name,
          (call.args ?? {}) as Record<string, unknown>,
        )
        responseParts.push({ functionResponse: { name: call.name, response: out } })
      }
      result = await chat.sendMessage(responseParts)
    }

    const text = result.response.text().trim()
    sessionHistories.set(turn.sessionId, stripInlineData(await chat.getHistory()))
    const transcript = await transcriptPromise
    return {
      text: text.length > 0 ? text : 'Hmm gue gak nangkep, coba ulangin?',
      transcript: transcript || undefined,
    }
  } catch (err) {
    logger.error({ err, sessionId: turn.sessionId }, 'companion turn failed')
    throw err
  }
}

export async function runCompanionChatTurn(
  userId: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void,
): Promise<string> {
  const db = getDb()

  const contentHistory: Content[] = history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const model = getGenAI().getGenerativeModel({
    model: COMPANION_MODEL,
    systemInstruction: companionSystemPrompt,
    tools: [{ functionDeclarations }],
  })

  const chat = model.startChat({ history: contentHistory })

  try {
    const streamResult = await chat.sendMessageStream(message)

    let accText = ''
    let hasToolCall = false

    for await (const chunk of streamResult.stream) {
      for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
        if ('text' in part && part.text) {
          accText += part.text
          onChunk(part.text)
        }
        if ('functionCall' in part && part.functionCall) {
          hasToolCall = true
        }
      }
    }

    if (!hasToolCall) {
      return accText || 'Hmm gue gak nangkep, coba ulangin?'
    }

    const response = await streamResult.response
    let currentResponse = response

    for (let hop = 0; hop < MAX_TOOL_HOPS; hop += 1) {
      const calls = currentResponse.functionCalls()
      if (!calls?.length) {
        const text = currentResponse.text().trim()
        if (text) onChunk(text)
        return text || 'Hmm gue gak nangkep, coba ulangin?'
      }
      const responseParts: Part[] = []
      for (const call of calls) {
        const out = await runToolCall(
          db,
          userId,
          call.name,
          (call.args ?? {}) as Record<string, unknown>,
        )
        responseParts.push({ functionResponse: { name: call.name, response: out } })
      }
      const next = await chat.sendMessage(responseParts)
      currentResponse = next.response
    }

    const finalText = currentResponse.text().trim()
    if (finalText) onChunk(finalText)
    return finalText || 'Hmm gue gak nangkep, coba ulangin?'
  } catch (err) {
    logger.error({ err, userId }, 'companion chat turn failed')
    throw err
  }
}

export function clearSessionHistory(sessionId: string): void {
  sessionHistories.delete(sessionId)
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
