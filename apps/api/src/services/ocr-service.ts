import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { OcrReceiptResponse } from '@catetin/types'
import { loadEnv } from '../env'
import { logger } from '../logger'

const VISION_MODEL = 'gemini-2.5-flash'

const CATEGORY_HINT =
  'makanan, minuman, transportasi, belanja, tagihan, hiburan, kesehatan, pendidikan, lainnya'

const PROMPT = [
  'Kamu ahli baca struk belanja Indonesia. Baca gambar struk ini dan ekstrak datanya.',
  'Aturan.',
  '- total: ambil GRAND TOTAL yang dibayar, dalam rupiah angka bulat (tanpa titik, tanpa desimal).',
  '- merchant: nama toko/tempat, atau null kalau gak kebaca.',
  '- date: tanggal transaksi format YYYY-MM-DD, atau null kalau gak ada.',
  '- items: daftar item utama (nama, qty, price rupiah bulat, category). Boleh kosong kalau gak kebaca.',
  `- category tiap item dan kategori umum: pilih dari ${CATEGORY_HINT}.`,
  '- confidence: high kalau yakin, medium kalau agak ragu, low kalau gambar buram/gak jelas.',
  'Balas HANYA JSON sesuai skema.',
].join('\n')

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    merchant: { type: SchemaType.STRING, nullable: true },
    date: { type: SchemaType.STRING, nullable: true },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          qty: { type: SchemaType.NUMBER },
          price: { type: SchemaType.NUMBER },
          category: { type: SchemaType.STRING },
        },
        required: ['name', 'qty', 'price', 'category'],
      },
    },
    total: { type: SchemaType.NUMBER },
    confidence: { type: SchemaType.STRING, format: 'enum', enum: ['high', 'medium', 'low'] },
  },
  required: ['merchant', 'date', 'items', 'total', 'confidence'],
} as const

let genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(loadEnv().GEMINI_API_KEY)
  return genAI
}

function toConfidence(value: unknown): 'high' | 'medium' | 'low' {
  return value === 'high' || value === 'low' ? value : 'medium'
}

export async function readReceipt(image: string, mimeType: string): Promise<OcrReceiptResponse> {
  const model = getGenAI().getGenerativeModel({
    model: VISION_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: responseSchema as any,
    },
  })

  const result = await model.generateContent([
    { inlineData: { mimeType, data: image } },
    { text: PROMPT },
  ])

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(result.response.text()) as Record<string, unknown>
  } catch (err) {
    logger.error({ err }, 'ocr parse failed')
    return { merchant: null, date: null, items: [], total: 0, confidence: 'low' }
  }

  const rawItems = Array.isArray(parsed.items) ? parsed.items : []
  const items = rawItems.map((item) => {
    const it = item as Record<string, unknown>
    return {
      name: typeof it.name === 'string' ? it.name : 'Item',
      qty: Number.isFinite(Number(it.qty)) ? Math.max(1, Math.round(Number(it.qty))) : 1,
      price: Number.isFinite(Number(it.price)) ? Math.max(0, Math.round(Number(it.price))) : 0,
      category: typeof it.category === 'string' ? it.category : 'lainnya',
    }
  })

  return {
    merchant: typeof parsed.merchant === 'string' ? parsed.merchant : null,
    date: typeof parsed.date === 'string' && parsed.date.length > 0 ? parsed.date : null,
    items,
    total: Number.isFinite(Number(parsed.total))
      ? Math.max(0, Math.round(Number(parsed.total)))
      : 0,
    confidence: toConfidence(parsed.confidence),
  }
}
