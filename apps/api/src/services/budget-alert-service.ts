import { Expo } from 'expo-server-sdk'
import { and, eq, gte, lt, sql } from 'drizzle-orm'
import { formatRupiah } from '@catetin/chat-core'
import { budgets, categories, notificationPrefs, transactions, type Database } from '@catetin/db'
import { logger } from '../logger'
import { periodRange } from './budget-service'

const expo = new Expo()

export async function checkBudgetAlerts(
  db: Database,
  userId: string,
  categoryId: string,
  kind: 'income' | 'expense' | 'transfer',
  txAmount: number,
): Promise<void> {
  if (kind !== 'expense' || txAmount <= 0) return

  const prefRows = await db
    .select({
      enabled: notificationPrefs.budgetAlerts,
      token: notificationPrefs.expoPushToken,
    })
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1)
  const pref = prefRows[0]
  if (!pref || !pref.enabled || !pref.token || !Expo.isExpoPushToken(pref.token)) return

  const userBudgets = await db
    .select({
      amount: budgets.amount,
      threshold: budgets.alertThreshold,
      period: budgets.period,
      categoryName: categories.name,
    })
    .from(budgets)
    .innerJoin(categories, eq(categories.id, budgets.categoryId))
    .where(and(eq(budgets.userId, userId), eq(budgets.categoryId, categoryId)))

  for (const b of userBudgets) {
    const { start, end } = periodRange(b.period)
    const rows = await db
      .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)::bigint` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.categoryId, categoryId),
          eq(transactions.kind, 'expense'),
          gte(transactions.occurredAt, start),
          lt(transactions.occurredAt, end),
        ),
      )
    const spentNow = Number(rows[0]?.total ?? 0)
    const spentPrev = Math.max(0, spentNow - txAmount)
    const thresholdAmount = (b.amount * b.threshold) / 100

    let title: string | null = null
    let body: string | null = null
    if (spentPrev < b.amount && spentNow >= b.amount) {
      title = `Boncos ${b.categoryName}`
      body = `Tembus 100% nih, ${formatRupiah(spentNow)} dari ${formatRupiah(b.amount)}. Tahan dulu yuk.`
    } else if (spentPrev < thresholdAmount && spentNow >= thresholdAmount) {
      const pct = Math.round((spentNow / b.amount) * 100)
      title = `Hati-hati ${b.categoryName}`
      body = `Udah ${pct}% dari budget. Sisa ${formatRupiah(b.amount - spentNow)}.`
    }
    if (!title || !body) continue

    try {
      await expo.sendPushNotificationsAsync([{ to: pref.token, sound: 'default', title, body }])
    } catch (err) {
      logger.error({ err }, 'budget alert push failed')
    }
  }
}
