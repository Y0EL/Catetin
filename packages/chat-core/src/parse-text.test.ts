import { describe, expect, it } from 'vitest'
import { detectCategoryFromText, parseAmountFromIndonesianText, parseQuickAddText } from './parse-text'

describe('parseAmountFromIndonesianText', () => {
  it('parses plain number', () => {
    expect(parseAmountFromIndonesianText('makan 35000')).toBe(35000)
  })

  it('parses rb suffix', () => {
    expect(parseAmountFromIndonesianText('makan 35rb')).toBe(35000)
  })

  it('parses k suffix', () => {
    expect(parseAmountFromIndonesianText('kopi 25k')).toBe(25000)
  })

  it('parses ribu suffix', () => {
    expect(parseAmountFromIndonesianText('transport 18 ribu')).toBe(18000)
  })

  it('parses jt suffix', () => {
    expect(parseAmountFromIndonesianText('gaji 5jt')).toBe(5_000_000)
  })

  it('parses decimal with rb', () => {
    expect(parseAmountFromIndonesianText('makan 12,5rb')).toBe(12500)
  })

  it('returns null when no amount', () => {
    expect(parseAmountFromIndonesianText('makan siang')).toBeNull()
  })
})

describe('detectCategoryFromText', () => {
  it('detects makanan', () => {
    expect(detectCategoryFromText('makan siang')).toBe('makanan')
  })

  it('detects transportasi', () => {
    expect(detectCategoryFromText('gojek ke kantor')).toBe('transportasi')
  })

  it('falls back to lainnya', () => {
    expect(detectCategoryFromText('xyz random')).toBe('lainnya')
  })
})

describe('parseQuickAddText', () => {
  it('returns full parse for typical input', () => {
    const result = parseQuickAddText('makan 35rb')
    expect(result).toEqual({
      amount: 35000,
      description: 'makan',
      category: 'makanan',
      confidence: 'medium',
    })
  })

  it('returns low confidence when category lainnya', () => {
    const result = parseQuickAddText('aneh 10rb')
    expect(result?.confidence).toBe('low')
  })

  it('returns null when no amount detected', () => {
    expect(parseQuickAddText('makan siang')).toBeNull()
  })
})
