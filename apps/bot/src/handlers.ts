import { downloadMediaMessage, type WAMessage, type WASocket } from '@whiskeysockets/baileys'
import { GoogleGenAI } from '@google/genai'
import { and, asc, eq, ilike, isNull, or } from 'drizzle-orm'
import { pino } from 'pino'
import { buildTransactionReply, parseQuickAddText } from '@catetin/chat-core'
import type {
  createDatabase} from '@catetin/db'
import {
  categories,
  channelLinks,
  linkingCodes,
  transactions,
  wallets,
} from '@catetin/db'

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' })

type DB = ReturnType<typeof createDatabase>

const OCR_PROMPT = `Kamu adalah OCR struk belanja. Baca foto struk dan return JSON saja tanpa teks lain:
{"total":<total_rupiah_integer>,"description":"<deskripsi_singkat_max_50_chars>"}
Jika struk tidak terbaca: {"total":0,"description":"struk tidak terbaca"}`

function normalizeJid(jid: string): string {
  const base = jid.split('@')[0]?.split(':')[0] ?? jid
  return `${base}@s.whatsapp.net`
}

async function resolveUserId(db: DB, jid: string): Promise<string | null> {
  const rows = await db
    .select({ userId: channelLinks.userId })
    .from(channelLinks)
    .where(
      and(eq(channelLinks.channel, 'whatsapp'), eq(channelLinks.externalId, normalizeJid(jid))),
    )
    .limit(1)
  return rows[0]?.userId ?? null
}

async function getDefaultWalletId(db: DB, userId: string): Promise<string | null> {
  const rows = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.isArchived, false)))
    .orderBy(asc(wallets.createdAt))
    .limit(1)
  return rows[0]?.id ?? null
}

async function resolveCategoryId(db: DB, userId: string, name: string): Promise<string | null> {
  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        ilike(categories.name, name),
        or(eq(categories.userId, userId), isNull(categories.userId)),
      ),
    )
    .orderBy(asc(categories.isPreset))
    .limit(1)
  if (rows[0]) return rows[0].id
  const fallback = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.kind, 'expense'), isNull(categories.userId)))
    .limit(1)
  return fallback[0]?.id ?? null
}

export async function handleLink(
  db: DB,
  socket: WASocket,
  msg: WAMessage,
  code: string,
): Promise<void> {
  const jid = msg.key.remoteJid ?? ''
  const normalized = normalizeJid(jid)
  const now = new Date()

  const rows = await db
    .select({
      userId: linkingCodes.userId,
      expiresAt: linkingCodes.expiresAt,
      usedAt: linkingCodes.usedAt,
    })
    .from(linkingCodes)
    .where(eq(linkingCodes.code, code.toUpperCase()))
    .limit(1)

  const row = rows[0]
  if (!row || row.usedAt || row.expiresAt < now) {
    await socket.sendMessage(jid, {
      text: 'Kode tidak valid atau sudah kadaluarsa. Generate ulang dari app Catetin ya.',
    })
    return
  }

  await db
    .insert(channelLinks)
    .values({ userId: row.userId, channel: 'whatsapp', externalId: normalized })
    .onConflictDoUpdate({
      target: [channelLinks.channel, channelLinks.externalId],
      set: { userId: row.userId },
    })

  await db
    .update(linkingCodes)
    .set({ usedAt: now })
    .where(eq(linkingCodes.code, code.toUpperCase()))

  await socket.sendMessage(jid, {
    text: [
      'Mantap, akun lo udah tersambung ke Catetin.',
      '',
      'Sekarang tinggal ngobrol aja. Contoh:',
      '  makan siang 35rb',
      '  beli pulsa 100k',
      '',
      'Atau kirim foto struk, nanti gue baca otomatis.',
    ].join('\n'),
  })
}

export async function handleText(
  db: DB,
  socket: WASocket,
  msg: WAMessage,
  text: string,
): Promise<void> {
  const jid = msg.key.remoteJid ?? ''
  const userId = await resolveUserId(db, jid)

  if (!userId) {
    await socket.sendMessage(jid, {
      text: 'Akun lo belum tersambung ke Catetin. Buka app, masuk Pengaturan, pilih Sambungin WhatsApp, lalu kirim kode ke sini:\n  link KODEMU',
    })
    return
  }

  const parsed = parseQuickAddText(text)
  if (!parsed || parsed.amount <= 0) {
    await socket.sendMessage(jid, {
      text: 'Belum nangkep nominalnya. Coba: "makan siang 35rb" atau "beli kopi 25000".',
    })
    return
  }

  const walletId = await getDefaultWalletId(db, userId)
  if (!walletId) {
    await socket.sendMessage(jid, {
      text: 'Lo belum punya wallet di Catetin. Tambah dulu di app ya.',
    })
    return
  }

  const categoryId = await resolveCategoryId(db, userId, parsed.category)
  if (!categoryId) {
    await socket.sendMessage(jid, { text: 'Ada masalah teknis, coba lagi.' })
    return
  }

  await db.insert(transactions).values({
    userId,
    walletId,
    categoryId,
    kind: 'expense',
    amount: parsed.amount,
    description: parsed.description,
    occurredAt: new Date(),
    source: 'whatsapp',
  })

  await socket.sendMessage(jid, {
    text: buildTransactionReply({ amount: parsed.amount, category: parsed.category }),
  })
}

export async function handlePhoto(
  db: DB,
  socket: WASocket,
  msg: WAMessage,
  geminiKey: string,
): Promise<void> {
  const jid = msg.key.remoteJid ?? ''
  const userId = await resolveUserId(db, jid)

  if (!userId) {
    await socket.sendMessage(jid, {
      text: 'Akun lo belum tersambung. Sambungin dulu dari app Catetin.',
    })
    return
  }

  await socket.sendMessage(jid, { text: 'Sebentar, lagi baca struknya...' })

  try {
    const raw = await downloadMediaMessage(msg, 'buffer', {})
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer)
    const base64 = buf.toString('base64')

    const ai = new GoogleGenAI({ apiKey: geminiKey })
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: OCR_PROMPT }, { inlineData: { mimeType: 'image/jpeg', data: base64 } }],
        },
      ],
    })

    const rawText = result.text?.trim() ?? ''
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('invalid json response')

    const parsed = JSON.parse(match[0]) as { total?: number; description?: string }
    const amount = Number(parsed.total ?? 0)
    const description = String(parsed.description ?? 'struk')

    if (amount <= 0) {
      await socket.sendMessage(jid, { text: 'Struiknya kurang jelas, coba foto ulang ya.' })
      return
    }

    const walletId = await getDefaultWalletId(db, userId)
    if (!walletId) {
      await socket.sendMessage(jid, {
        text: 'Lo belum punya wallet di Catetin. Tambah dulu di app.',
      })
      return
    }

    const categoryId = await resolveCategoryId(db, userId, 'lainnya')
    if (!categoryId) throw new Error('no category')

    await db.insert(transactions).values({
      userId,
      walletId,
      categoryId,
      kind: 'expense',
      amount,
      description,
      occurredAt: new Date(),
      source: 'whatsapp',
    })

    await socket.sendMessage(jid, {
      text: buildTransactionReply({ amount, category: description }),
    })
  } catch (err) {
    logger.error({ err, userId }, 'photo handler gagal')
    await socket.sendMessage(jid, { text: 'Gagal baca struk, coba foto ulang.' })
  }
}
