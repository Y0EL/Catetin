import { and, eq, gte, isNull, lt, sql } from 'drizzle-orm'
import { companionMessages, companionSessions, users, type Database } from '@catetin/db'
import type { CompanionMessageDto, CompanionQuota } from '@catetin/types'
import { HttpError } from '../errors'

const FREE_DAILY_LIMIT_SEC = 600

function startOfTodayJakarta(): Date {
  const now = new Date()
  const offsetMs = 7 * 60 * 60 * 1000
  const jak = new Date(now.getTime() + offsetMs)
  jak.setUTCHours(0, 0, 0, 0)
  return new Date(jak.getTime() - offsetMs)
}

async function isUserPro(db: Database, userId: string): Promise<boolean> {
  const rows = await db
    .select({ isSubscribed: users.isSubscribed })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return rows[0]?.isSubscribed === true
}

export async function getCompanionQuota(db: Database, userId: string): Promise<CompanionQuota> {
  const isPro = await isUserPro(db, userId)
  if (isPro) {
    return {
      dailyLimitSec: 0,
      usedTodaySec: 0,
      remainingSec: 0,
      isPro: true,
    }
  }
  const startToday = startOfTodayJakarta()
  const rows = await db
    .select({
      used: sql<string>`coalesce(sum(${companionSessions.durationSec}), 0)::int`,
    })
    .from(companionSessions)
    .where(and(eq(companionSessions.userId, userId), gte(companionSessions.startedAt, startToday)))
  const used = Number(rows[0]?.used ?? 0)
  return {
    dailyLimitSec: FREE_DAILY_LIMIT_SEC,
    usedTodaySec: used,
    remainingSec: Math.max(0, FREE_DAILY_LIMIT_SEC - used),
    isPro: false,
  }
}

export async function startCompanionSession(
  db: Database,
  userId: string,
): Promise<{ sessionId: string; expiresInSec: number }> {
  const quota = await getCompanionQuota(db, userId)
  const expiresInSec = quota.isPro ? 60 * 60 : quota.remainingSec
  if (!quota.isPro && expiresInSec <= 0) {
    throw new HttpError(402, 'PAYMENT_REQUIRED', 'Kuota harian habis. Upgrade Pro buat unlimited.')
  }
  const rows = await db
    .insert(companionSessions)
    .values({ userId, wasSubscribed: quota.isPro })
    .returning({ id: companionSessions.id })
  const sessionId = rows[0]?.id
  if (!sessionId) throw new HttpError(500, 'INTERNAL', 'Gagal mulai sesi')
  return { sessionId, expiresInSec }
}

export async function assertSessionOwnedAndActive(
  db: Database,
  userId: string,
  sessionId: string,
): Promise<void> {
  const rows = await db
    .select({ id: companionSessions.id })
    .from(companionSessions)
    .where(
      and(
        eq(companionSessions.id, sessionId),
        eq(companionSessions.userId, userId),
        isNull(companionSessions.endedAt),
      ),
    )
    .limit(1)
  if (!rows[0]) throw new HttpError(404, 'NOT_FOUND', 'Sesi gak ketemu atau udah selesai')
}

export async function saveCompanionMessages(
  db: Database,
  userId: string,
  messages: Array<{ role: string; content: string; source: string }>,
): Promise<void> {
  if (messages.length === 0) return
  await db.insert(companionMessages).values(
    messages.map((m) => ({
      userId,
      role: m.role,
      content: m.content,
      source: m.source,
    })),
  )
}

export async function getCompanionHistory(
  db: Database,
  userId: string,
  limit = 50,
  before?: Date,
): Promise<CompanionMessageDto[]> {
  const conditions = [eq(companionMessages.userId, userId)]
  if (before) conditions.push(lt(companionMessages.createdAt, before))

  const rows = await db
    .select()
    .from(companionMessages)
    .where(and(...conditions))
    .orderBy(sql`${companionMessages.createdAt} desc`)
    .limit(limit)

  return rows.reverse().map((r) => ({
    id: r.id,
    role: r.role as 'user' | 'model',
    content: r.content,
    source: r.source as 'voice' | 'chat',
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function deleteAllCompanionMessages(db: Database, userId: string): Promise<void> {
  await db.delete(companionMessages).where(eq(companionMessages.userId, userId))
}

export async function endCompanionSession(
  db: Database,
  userId: string,
  sessionId: string,
): Promise<void> {
  const rows = await db
    .select({ startedAt: companionSessions.startedAt })
    .from(companionSessions)
    .where(
      and(
        eq(companionSessions.id, sessionId),
        eq(companionSessions.userId, userId),
        isNull(companionSessions.endedAt),
      ),
    )
    .limit(1)
  const row = rows[0]
  if (!row) return
  const endedAt = new Date()
  const durationSec = Math.max(0, Math.round((endedAt.getTime() - row.startedAt.getTime()) / 1000))
  await db
    .update(companionSessions)
    .set({ endedAt, durationSec })
    .where(eq(companionSessions.id, sessionId))
}
