import { and, eq, gte, lt, sql } from 'drizzle-orm'
import { budgets, categories, transactions, type Budget, type Database } from '@catetin/db'
import type { BudgetWithStatus, CreateBudgetInput, UpdateBudgetInput } from '@catetin/types'
import { HttpError } from '../errors'

export function periodRange(
  period: 'monthly' | 'weekly',
  now: Date = new Date(),
): {
  start: Date
  end: Date
} {
  if (period === 'monthly') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    return { start, end }
  }
  // weekly, Senin sebagai awal
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dow = d.getUTCDay() // 0 minggu, 1 senin ...
  const offset = dow === 0 ? 6 : dow - 1
  const start = new Date(d)
  start.setUTCDate(d.getUTCDate() - offset)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 7)
  return { start, end }
}

export async function listBudgetsWithStatus(
  db: Database,
  userId: string,
): Promise<BudgetWithStatus[]> {
  const rows = await db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      period: budgets.period,
      amount: budgets.amount,
      alertThreshold: budgets.alertThreshold,
    })
    .from(budgets)
    .innerJoin(categories, eq(categories.id, budgets.categoryId))
    .where(eq(budgets.userId, userId))

  if (rows.length === 0) return []

  const result: BudgetWithStatus[] = []
  for (const row of rows) {
    const { start, end } = periodRange(row.period)
    const spentRows = await db
      .select({
        total: sql<string>`coalesce(sum(${transactions.amount}), 0)::bigint`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.categoryId, row.categoryId),
          eq(transactions.kind, 'expense'),
          gte(transactions.occurredAt, start),
          lt(transactions.occurredAt, end),
        ),
      )
    const spent = Number(spentRows[0]?.total ?? 0)
    result.push({
      id: row.id,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      period: row.period,
      amount: row.amount,
      alertThreshold: row.alertThreshold,
      spent,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    })
  }
  return result
}

export async function createBudget(
  db: Database,
  userId: string,
  input: CreateBudgetInput,
): Promise<Budget> {
  const owned = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId)))
    .limit(1)
  if (owned.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Kategori gak ketemu')

  const rows = await db
    .insert(budgets)
    .values({
      userId,
      categoryId: input.categoryId,
      period: input.period,
      amount: input.amount,
      alertThreshold: input.alertThreshold,
      startsAt: input.startsAt,
    })
    .returning()
  return rows[0]!
}

export async function updateBudget(
  db: Database,
  userId: string,
  id: string,
  input: UpdateBudgetInput,
): Promise<Budget> {
  const rows = await db
    .update(budgets)
    .set({
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.alertThreshold !== undefined ? { alertThreshold: input.alertThreshold } : {}),
      ...(input.period !== undefined ? { period: input.period } : {}),
    })
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .returning()
  if (rows.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Budget gak ketemu')
  return rows[0]!
}

export async function deleteBudget(db: Database, userId: string, id: string): Promise<void> {
  await db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
}
