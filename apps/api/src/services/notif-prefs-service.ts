import { eq } from 'drizzle-orm'
import { notificationPrefs, type Database } from '@catetin/db'
import type { NotifPrefs, UpdateNotifPrefsInput } from '@catetin/types'

async function ensureRow(db: Database, userId: string): Promise<void> {
  await db.insert(notificationPrefs).values({ userId }).onConflictDoNothing()
}

export async function getNotifPrefs(db: Database, userId: string): Promise<NotifPrefs> {
  await ensureRow(db, userId)
  const rows = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1)
  const row = rows[0]
  return {
    dailyReminder: row?.dailyReminder ?? true,
    weeklyRecap: row?.weeklyRecap ?? true,
    budgetAlerts: row?.budgetAlerts ?? true,
    hasPushToken: Boolean(row?.expoPushToken),
  }
}

export async function updateNotifPrefs(
  db: Database,
  userId: string,
  input: UpdateNotifPrefsInput,
): Promise<NotifPrefs> {
  await ensureRow(db, userId)
  await db
    .update(notificationPrefs)
    .set({
      ...(input.dailyReminder !== undefined ? { dailyReminder: input.dailyReminder } : {}),
      ...(input.weeklyRecap !== undefined ? { weeklyRecap: input.weeklyRecap } : {}),
      ...(input.budgetAlerts !== undefined ? { budgetAlerts: input.budgetAlerts } : {}),
    })
    .where(eq(notificationPrefs.userId, userId))
  return getNotifPrefs(db, userId)
}
