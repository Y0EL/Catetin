import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk'
import { eq, sql } from 'drizzle-orm'
import { notificationPrefs, type Database } from '@catetin/db'
import { logger } from '../logger'

const expo = new Expo()

export async function saveExpoPushToken(
  db: Database,
  userId: string,
  token: string,
): Promise<void> {
  if (!Expo.isExpoPushToken(token)) {
    throw new Error('Invalid Expo push token')
  }
  await db
    .insert(notificationPrefs)
    .values({ userId, expoPushToken: token })
    .onConflictDoUpdate({
      target: notificationPrefs.userId,
      set: { expoPushToken: token },
    })
}

export async function getUserPushToken(db: Database, userId: string): Promise<string | null> {
  const rows = await db
    .select({ token: notificationPrefs.expoPushToken })
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1)
  return rows[0]?.token ?? null
}

export async function sendPushToUser(
  db: Database,
  userId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> },
): Promise<ExpoPushTicket | null> {
  const token = await getUserPushToken(db, userId)
  if (!token) return null
  if (!Expo.isExpoPushToken(token)) return null

  const message: ExpoPushMessage = {
    to: token,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  }
  try {
    const tickets = await expo.sendPushNotificationsAsync([message])
    return tickets[0] ?? null
  } catch (err) {
    logger.error({ err, userId }, 'gagal kirim push')
    return null
  }
}

export async function listActivePushTokens(
  db: Database,
): Promise<{ userId: string; token: string }[]> {
  const rows = await db
    .select({ userId: notificationPrefs.userId, token: notificationPrefs.expoPushToken })
    .from(notificationPrefs)
    .where(sql`${notificationPrefs.expoPushToken} IS NOT NULL`)
  const out: { userId: string; token: string }[] = []
  for (const r of rows) {
    if (r.token && Expo.isExpoPushToken(r.token)) {
      out.push({ userId: r.userId, token: r.token })
    }
  }
  return out
}
