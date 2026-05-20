import { describe, expect, it } from 'vitest'
import {
  decodeCursor,
  encodeCursor,
  foldSummary,
  monthToRange,
  type SummaryRow,
} from './transaction-service'

describe('monthToRange', () => {
  it('computes UTC month boundaries', () => {
    const { start, end } = monthToRange('2026-05')
    expect(start.toISOString()).toBe('2026-05-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-06-01T00:00:00.000Z')
  })

  it('rolls over to next year in December', () => {
    const { start, end } = monthToRange('2026-12')
    expect(start.toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })
})

describe('cursor encode/decode', () => {
  it('round trips', () => {
    const cursor = { occurredAt: '2026-05-20T10:00:00.000Z', id: 'abc-123' }
    const decoded = decodeCursor(encodeCursor(cursor))
    expect(decoded).toEqual(cursor)
  })

  it('returns null when separator missing', () => {
    const encoded = Buffer.from('nopipe').toString('base64url')
    expect(decodeCursor(encoded)).toBeNull()
  })
})

describe('foldSummary', () => {
  it('splits income and expense and sorts categories desc', () => {
    const rows: SummaryRow[] = [
      { kind: 'expense', categoryId: 'c1', categoryName: 'makanan', total: 50000 },
      { kind: 'expense', categoryId: 'c2', categoryName: 'belanja', total: 120000 },
      { kind: 'income', categoryId: 'c3', categoryName: 'gaji', total: 5000000 },
    ]
    const summary = foldSummary('2026-05', rows)
    expect(summary.income).toBe(5000000)
    expect(summary.expense).toBe(170000)
    expect(summary.net).toBe(4830000)
    expect(summary.byCategory[0]?.name).toBe('belanja')
    expect(summary.byCategory).toHaveLength(2)
  })

  it('returns zeros for empty input', () => {
    const summary = foldSummary('2026-05', [])
    expect(summary).toEqual({
      month: '2026-05',
      income: 0,
      expense: 0,
      net: 0,
      byCategory: [],
    })
  })
})
