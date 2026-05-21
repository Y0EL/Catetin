import { and, asc, eq, gte, lt } from 'drizzle-orm'
import { categories, transactions, wallets, type Database } from '@catetin/db'
import { monthToRange } from './transaction-service'

function escape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function buildMonthlyCsv(
  db: Database,
  userId: string,
  month: string,
): Promise<string> {
  const { start, end } = monthToRange(month)
  const rows = await db
    .select({
      occurredAt: transactions.occurredAt,
      kind: transactions.kind,
      amount: transactions.amount,
      description: transactions.description,
      merchant: transactions.merchant,
      categoryName: categories.name,
      walletName: wallets.name,
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, start),
        lt(transactions.occurredAt, end),
      ),
    )
    .orderBy(asc(transactions.occurredAt))

  const header = ['Tanggal', 'Jenis', 'Nominal', 'Deskripsi', 'Merchant', 'Kategori', 'Wallet']
  const lines = [header.map(escape).join(',')]
  for (const r of rows) {
    lines.push(
      [
        r.occurredAt.toISOString().slice(0, 10),
        r.kind,
        r.amount,
        r.description ?? '',
        r.merchant ?? '',
        r.categoryName,
        r.walletName,
      ]
        .map(escape)
        .join(','),
    )
  }
  return lines.join('\n')
}
