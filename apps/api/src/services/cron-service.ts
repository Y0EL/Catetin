import cron, { type ScheduledTask } from 'node-cron'
import { Expo } from 'expo-server-sdk'
import { and, eq, gte, isNotNull, lt, sql } from 'drizzle-orm'
import { notificationPrefs, transactions, type Database } from '@catetin/db'
import { logger } from '../logger'
import { formatRupiah } from '@catetin/chat-core'

const TZ = 'Asia/Jakarta'
const expo = new Expo()

type Message = { token: string; title: string; body: string }

async function sendBatch(messages: Message[]): Promise<void> {
  const chunks = expo.chunkPushNotifications(
    messages
      .filter((m) => Expo.isExpoPushToken(m.token))
      .map((m) => ({
        to: m.token,
        sound: 'default',
        title: m.title,
        body: m.body,
      })),
  )
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk)
    } catch (err) {
      logger.error({ err }, 'gagal kirim batch push')
    }
  }
}

function startOfTodayJakarta(): Date {
  const now = new Date()
  const offsetMs = 7 * 60 * 60 * 1000
  const jakartaNow = new Date(now.getTime() + offsetMs)
  jakartaNow.setUTCHours(0, 0, 0, 0)
  return new Date(jakartaNow.getTime() - offsetMs)
}

function weekStartJakarta(now: Date = new Date()): Date {
  const offsetMs = 7 * 60 * 60 * 1000
  const jak = new Date(now.getTime() + offsetMs)
  const day = jak.getUTCDay()
  const diff = (day + 6) % 7
  jak.setUTCDate(jak.getUTCDate() - diff)
  jak.setUTCHours(0, 0, 0, 0)
  return new Date(jak.getTime() - offsetMs)
}

async function runDailyReminder(db: Database): Promise<void> {
  const startToday = startOfTodayJakarta()
  const rows = await db
    .select({
      userId: notificationPrefs.userId,
      token: notificationPrefs.expoPushToken,
      txCount: sql<string>`(
        select count(*) from ${transactions}
        where ${transactions.userId} = ${notificationPrefs.userId}
          and ${transactions.occurredAt} >= ${startToday}
      )::int`,
    })
    .from(notificationPrefs)
    .where(
      and(eq(notificationPrefs.dailyReminder, true), isNotNull(notificationPrefs.expoPushToken)),
    )

  const messages: Message[] = []
  for (const r of rows) {
    if (!r.token) continue
    if (Number(r.txCount) > 0) continue
    messages.push({
      token: r.token,
      title: 'Yuk catat hari ini',
      body: 'Belum ada catatan hari ini. Tulis "makan 35rb" aja udah cukup.',
    })
  }
  if (messages.length > 0) {
    logger.info({ count: messages.length }, 'kirim daily reminder')
    await sendBatch(messages)
  }
}

async function runWeeklyRecap(db: Database): Promise<void> {
  const weekStart = weekStartJakarta()
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  const rows = await db
    .select({
      userId: notificationPrefs.userId,
      token: notificationPrefs.expoPushToken,
      income: sql<string>`coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amount} else 0 end), 0)::bigint`,
      expense: sql<string>`coalesce(sum(case when ${transactions.kind} = 'expense' then ${transactions.amount} else 0 end), 0)::bigint`,
    })
    .from(notificationPrefs)
    .leftJoin(
      transactions,
      and(
        eq(transactions.userId, notificationPrefs.userId),
        gte(transactions.occurredAt, lastWeekStart),
        lt(transactions.occurredAt, weekStart),
      ),
    )
    .where(and(eq(notificationPrefs.weeklyRecap, true), isNotNull(notificationPrefs.expoPushToken)))
    .groupBy(notificationPrefs.userId, notificationPrefs.expoPushToken)

  const messages: Message[] = []
  for (const r of rows) {
    if (!r.token) continue
    const income = Number(r.income)
    const expense = Number(r.expense)
    messages.push({
      token: r.token,
      title: 'Rekap minggu lalu',
      body: `Pemasukan ${formatRupiah(income)}, pengeluaran ${formatRupiah(expense)}. Cek detail di app.`,
    })
  }
  if (messages.length > 0) {
    logger.info({ count: messages.length }, 'kirim weekly recap')
    await sendBatch(messages)
  }
}

const tasks: ScheduledTask[] = []

export function registerCrons(db: Database): void {
  tasks.forEach((t) => t.stop())
  tasks.length = 0

  tasks.push(
    cron.schedule(
      '0 20 * * *',
      () => {
        runDailyReminder(db).catch((err) => logger.error({ err }, 'daily reminder failed'))
      },
      { timezone: TZ },
    ),
  )
  tasks.push(
    cron.schedule(
      '0 8 * * 1',
      () => {
        runWeeklyRecap(db).catch((err) => logger.error({ err }, 'weekly recap failed'))
      },
      { timezone: TZ },
    ),
  )

  logger.info({ jobs: tasks.length }, 'cron jobs registered')
}

export async function triggerDailyReminderNow(db: Database): Promise<void> {
  await runDailyReminder(db)
}

export async function triggerWeeklyRecapNow(db: Database): Promise<void> {
  await runWeeklyRecap(db)
}
