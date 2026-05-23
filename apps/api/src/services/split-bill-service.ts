import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai'
import { splitBillSystemPrompt } from '@catetin/prompts'
import { loadEnv } from '../env'
import { logger } from '../logger'

const SPLIT_MODEL = 'gemini-2.5-flash'
const MAX_HOPS = 6

export type SplitShare = { nama: string; jumlah: number; aku: boolean }
export type SplitResult = { total: number; hasil: SplitShare[] }

const splitDeclaration: FunctionDeclaration = {
  name: 'hitung_split_bill',
  description:
    'Hitung pembagian tagihan. Panggil setelah semua info (total + daftar orang + rasio) terkumpul.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      total: { type: SchemaType.NUMBER, description: 'Total tagihan dalam rupiah.' },
      orang: {
        type: SchemaType.ARRAY,
        description: 'Daftar orang beserta rasio porsi.',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            nama: {
              type: SchemaType.STRING,
              description: 'Nama orang, atau "Lo" untuk user sendiri.',
            },
            rasio: { type: SchemaType.NUMBER, description: 'Proporsi relatif, 1.0 = rata.' },
            aku: { type: SchemaType.BOOLEAN, description: 'true jika ini si user.' },
          },
          required: ['nama', 'rasio', 'aku'],
        },
      },
    },
    required: ['total', 'orang'],
  },
}

function calcSplit(
  total: number,
  orang: { nama: string; rasio: number; aku: boolean }[],
): SplitResult {
  const totalRasio = orang.reduce((s, o) => s + o.rasio, 0)
  const hasil = orang.map((o) => ({
    nama: o.nama,
    jumlah: Math.round((o.rasio / totalRasio) * total),
    aku: o.aku,
  }))
  // Koreksi pembulatan — lebihkan ke user kalau ada sisa
  const selisih = total - hasil.reduce((s, h) => s + h.jumlah, 0)
  const akuIdx = hasil.findIndex((h) => h.aku)
  if (selisih !== 0 && akuIdx >= 0) hasil[akuIdx]!.jumlah += selisih
  return { total, hasil }
}

let genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(loadEnv().GEMINI_API_KEY)
  return genAI
}

export async function runSplitBillTurn(
  message: string,
  history: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void,
  onResult: (result: SplitResult) => void,
): Promise<string> {
  const contentHistory: Content[] = history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const model = getGenAI().getGenerativeModel({
    model: SPLIT_MODEL,
    systemInstruction: splitBillSystemPrompt,
    tools: [{ functionDeclarations: [splitDeclaration] }],
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

    if (!hasToolCall) return accText || 'Hmm, coba ulangin?'

    const response = await streamResult.response
    let currentResponse = response

    for (let hop = 0; hop < MAX_HOPS; hop += 1) {
      const calls = currentResponse.functionCalls()
      if (!calls?.length) {
        const text = currentResponse.text().trim()
        if (text) onChunk(text)
        return text || 'Hmm, coba ulangin?'
      }

      const responseParts: Part[] = []
      for (const call of calls) {
        if (call.name === 'hitung_split_bill') {
          const args = call.args as {
            total: number
            orang: { nama: string; rasio: number; aku: boolean }[]
          }
          const result = calcSplit(args.total, args.orang ?? [])
          onResult(result)
          responseParts.push({
            functionResponse: {
              name: call.name,
              response: { ok: true, hasil: result.hasil, total: result.total },
            },
          })
        }
      }

      const next = await chat.sendMessage(responseParts)
      currentResponse = next.response
    }

    const finalText = currentResponse.text().trim()
    if (finalText) onChunk(finalText)
    return finalText || 'Hmm, coba ulangin?'
  } catch (err) {
    logger.error({ err }, 'split bill turn failed')
    throw err
  }
}
