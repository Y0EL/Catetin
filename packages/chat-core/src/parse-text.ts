import type { ValidCategoryName } from '@catetin/types'

export type ParsedTextTransaction = {
  amount: number
  description: string
  category: ValidCategoryName
  confidence: 'high' | 'medium' | 'low'
}

const amountPattern = /(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta|m|jutaan)?/i

const categoryKeywords: Record<ValidCategoryName, string[]> = {
  makanan: ['makan', 'sarapan', 'lunch', 'dinner', 'nasi', 'mie', 'bakso', 'soto', 'ayam', 'pizza', 'burger'],
  minuman: ['kopi', 'teh', 'jus', 'minum', 'starbucks', 'kopken', 'boba', 'cappuccino'],
  transportasi: ['gojek', 'grab', 'ojek', 'taxi', 'bensin', 'parkir', 'tol', 'kereta', 'busway', 'mrt', 'lrt', 'angkot'],
  belanja: ['indomaret', 'alfamart', 'belanja', 'shopee', 'tokopedia', 'lazada', 'baju', 'sepatu'],
  tagihan: ['listrik', 'air', 'pulsa', 'internet', 'wifi', 'pdam', 'pln', 'indihome', 'biznet'],
  hiburan: ['netflix', 'spotify', 'bioskop', 'cinema', 'game', 'steam', 'youtube'],
  kesehatan: ['obat', 'apotek', 'dokter', 'rs', 'rumah sakit', 'klinik', 'vitamin'],
  pendidikan: ['buku', 'kursus', 'sekolah', 'kuliah', 'spp', 'les'],
  lainnya: [],
}

export function parseAmountFromIndonesianText(text: string): number | null {
  const match = text.match(amountPattern)
  if (!match) return null
  const base = parseFloat(match[1]!.replace(',', '.'))
  if (!Number.isFinite(base)) return null
  const suffix = match[2]?.toLowerCase()
  if (suffix === 'rb' || suffix === 'ribu' || suffix === 'k') return Math.round(base * 1000)
  if (suffix === 'jt' || suffix === 'juta' || suffix === 'm' || suffix === 'jutaan') return Math.round(base * 1_000_000)
  return Math.round(base)
}

export function detectCategoryFromText(text: string): ValidCategoryName {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(categoryKeywords) as [ValidCategoryName, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return category
  }
  return 'lainnya'
}

export function parseQuickAddText(text: string): ParsedTextTransaction | null {
  const amount = parseAmountFromIndonesianText(text)
  if (amount === null || amount <= 0) return null
  const category = detectCategoryFromText(text)
  const description = text.replace(amountPattern, '').trim().replace(/\s+/g, ' ')
  return {
    amount,
    description: description.length > 0 ? description : category,
    category,
    confidence: category === 'lainnya' ? 'low' : 'medium',
  }
}
