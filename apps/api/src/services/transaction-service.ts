import { and, desc, eq, gte, ilike, inArray, lt, lte, or, sql, type SQL } from 'drizzle-orm'
import { categories, transactions, wallets, type Database, type Transaction } from '@catetin/db'
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  MonthSummary,
  UpdateTransactionInput,
} from '@catetin/types'
import { HttpError } from '../errors'

export function monthToRange(month: string): { start: Date; end: Date } {
  const parts = month.split('-')
  const year = Number.parseInt(parts[0] ?? '0', 10)
  const mon = Number.parseInt(parts[1] ?? '0', 10)
  const start = new Date(Date.UTC(year, mon - 1, 1))
  const end = new Date(Date.UTC(year, mon, 1))
  return { start, end }
}

export type Cursor = { occurredAt: string; id: string }

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(`${cursor.occurredAt}|${cursor.id}`).toString('base64url')
}

export function decodeCursor(raw: string): Cursor | null {
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8')
    const idx = decoded.lastIndexOf('|')
    if (idx < 0) return null
    return { occurredAt: decoded.slice(0, idx), id: decoded.slice(idx + 1) }
  } catch {
    return null
  }
}

export type SummaryRow = {
  kind: 'expense' | 'income' | 'transfer'
  categoryId: string
  categoryName: string
  total: number
}

export function foldSummary(month: string, rows: SummaryRow[]): MonthSummary {
  let income = 0
  let expense = 0
  const byCategory: { categoryId: string; name: string; total: number }[] = []
  for (const row of rows) {
    if (row.kind === 'income') {
      income += row.total
    } else if (row.kind === 'expense') {
      expense += row.total
      byCategory.push({ categoryId: row.categoryId, name: row.categoryName, total: row.total })
    }
  }
  byCategory.sort((a, b) => b.total - a.total)
  return { month, income, expense, net: income - expense, byCategory }
}

export async function listTransactions(
  db: Database,
  userId: string,
  query: ListTransactionsQuery,
): Promise<{ rows: Transaction[]; nextCursor: string | null }> {
  const conds: SQL[] = [eq(transactions.userId, userId)]
  if (query.from) conds.push(gte(transactions.occurredAt, new Date(query.from)))
  if (query.to) conds.push(lte(transactions.occurredAt, new Date(query.to)))
  if (query.category) conds.push(eq(transactions.categoryId, query.category))
  if (query.wallet) conds.push(eq(transactions.walletId, query.wallet))
  if (query.q) {
    const like = `%${query.q}%`
    const match = or(ilike(transactions.description, like), ilike(transactions.merchant, like))
    if (match) conds.push(match)
  }

  const cursor = query.cursor ? decodeCursor(query.cursor) : null
  if (cursor) {
    const at = new Date(cursor.occurredAt)
    const keyset = or(
      lt(transactions.occurredAt, at),
      and(eq(transactions.occurredAt, at), lt(transactions.id, cursor.id)),
    )
    if (keyset) conds.push(keyset)
  }

  const rows = await db
    .select()
    .from(transactions)
    .where(and(...conds))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))
    .limit(query.limit + 1)

  let nextCursor: string | null = null
  if (rows.length > query.limit) {
    const last = rows[query.limit - 1]!
    nextCursor = encodeCursor({ occurredAt: last.occurredAt.toISOString(), id: last.id })
    rows.length = query.limit
  }
  return { rows, nextCursor }
}

export async function createTransaction(
  db: Database,
  userId: string,
  input: CreateTransactionInput,
): Promise<Transaction> {
  const ownedWallet = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(and(eq(wallets.id, input.walletId), eq(wallets.userId, userId)))
    .limit(1)
  if (ownedWallet.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Wallet gak ketemu')

  const ownedCategory = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId)))
    .limit(1)
  if (ownedCategory.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Kategori gak ketemu')

  const rows = await db
    .insert(transactions)
    .values({
      userId,
      walletId: input.walletId,
      categoryId: input.categoryId,
      kind: input.kind,
      amount: input.amount,
      description: input.description ?? null,
      merchant: input.merchant ?? null,
      occurredAt: new Date(input.occurredAt),
      source: input.source,
    })
    .returning()
  return rows[0]!
}

export async function deleteTransaction(db: Database, userId: string, id: string): Promise<void> {
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
}

export async function bulkDeleteTransactions(
  db: Database,
  userId: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0
  const rows = await db
    .delete(transactions)
    .where(and(eq(transactions.userId, userId), inArray(transactions.id, ids)))
    .returning({ id: transactions.id })
  return rows.length
}

export async function updateTransaction(
  db: Database,
  userId: string,
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  if (input.walletId !== undefined) {
    const ownedWallet = await db
      .select({ id: wallets.id })
      .from(wallets)
      .where(and(eq(wallets.id, input.walletId), eq(wallets.userId, userId)))
      .limit(1)
    if (ownedWallet.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Wallet gak ketemu')
  }
  if (input.categoryId !== undefined) {
    const ownedCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId)))
      .limit(1)
    if (ownedCategory.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Kategori gak ketemu')
  }
  const rows = await db
    .update(transactions)
    .set({
      ...(input.walletId !== undefined ? { walletId: input.walletId } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.merchant !== undefined ? { merchant: input.merchant } : {}),
      ...(input.occurredAt !== undefined ? { occurredAt: new Date(input.occurredAt) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning()
  if (rows.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Transaksi gak ketemu')
  return rows[0]!
}

export async function getMonthSummary(
  db: Database,
  userId: string,
  month: string,
): Promise<MonthSummary> {
  const { start, end } = monthToRange(month)
  const rows = await db
    .select({
      kind: transactions.kind,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      total: sql<string>`coalesce(sum(${transactions.amount}), 0)::bigint`,
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, start),
        lt(transactions.occurredAt, end),
      ),
    )
    .groupBy(transactions.kind, transactions.categoryId, categories.name)
  return foldSummary(
    month,
    rows.map((r) => ({ ...r, total: Number(r.total) })),
  )
}
