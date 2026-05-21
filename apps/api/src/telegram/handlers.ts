import { formatRupiah, parseQuickAddText } from '@catetin/chat-core'
import type { Bot, Context } from 'grammy'
import { getDb } from '../db'
import { loadEnv } from '../env'
import { logger } from '../logger'
import { recordChatTransaction } from '../services/chat-transaction-service'
import { runAgentTurn } from '../services/gemini-agent'
import { consumeLinkingCode, resolveUserByChannel } from '../services/linking-service'

const MAX_MEDIA_BYTES = 20 * 1024 * 1024

const linkPrompt = [
  'Akun lo belum kesambung sama Catetin.',
  '',
  'Cara nyambungin. Buka app Catetin, masuk Pengaturan, pilih Sambungin Telegram.',
  'Nanti dikasih kode. Kirim ke sini gini.',
  '  /start KODE',
].join('\n')

const welcomeLinked = [
  'Mantap, akun lo udah kesambung.',
  '',
  'Sekarang tinggal ngobrol aja sama gue. Contoh.',
  '  tadi jajan kopi sama temen 50rb',
  '  beli pulsa 100k',
  '  gaji bulan ini udah masuk 5jt',
  '',
  'Atau kirim foto atau video struk, nanti gue baca dan ajuin buat dicatat.',
].join('\n')

const helpMessage = [
  'Ngobrol aja biasa, gue ngerti.',
  '  tadi makan siang 35rb',
  '  pengeluaran gue bulan ini berapa',
  '  hapus catatan terakhir',
  '',
  'Kirim foto atau video struk juga bisa, nanti gue baca otomatis.',
].join('\n')

function capitalize(text: string): string {
  if (text.length === 0) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function conversationId(ctx: Context): string {
  return `telegram:${ctx.chat?.id ?? 'unknown'}`
}

async function downloadFileAsBase64(
  ctx: Context,
  fileId: string,
): Promise<{ data: string; mimeType: string } | null> {
  const file = await ctx.api.getFile(fileId)
  if (!file.file_path) return null
  const token = loadEnv().TELEGRAM_BOT_TOKEN
  const res = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`)
  if (!res.ok) return null
  const buffer = Buffer.from(await res.arrayBuffer())
  const lower = file.file_path.toLowerCase()
  const mimeType = lower.endsWith('.png')
    ? 'image/png'
    : lower.endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg'
  return { data: buffer.toString('base64'), mimeType }
}

export function registerHandlers(bot: Bot) {
  bot.command('start', async (ctx) => {
    const db = getDb()
    const externalId = String(ctx.chat.id)
    const code = ctx.match.trim()

    if (code.length === 0) {
      const linked = await resolveUserByChannel(db, 'telegram', externalId)
      await ctx.reply(linked ? welcomeLinked : linkPrompt)
      return
    }

    const result = await consumeLinkingCode(db, code, 'telegram', externalId)
    if (result.status === 'linked') {
      await ctx.reply(welcomeLinked)
      logger.info({ externalId, userId: result.userId }, 'telegram linked')
      return
    }
    if (result.status === 'already') {
      await ctx.reply('Chat ini udah kesambung ke akun Catetin. Langsung ngobrol aja.')
      return
    }
    await ctx.reply('Kodenya salah atau udah kadaluarsa. Minta kode baru dari app ya.')
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(helpMessage)
  })

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text
    if (text.startsWith('/')) return

    const db = getDb()
    const userId = await resolveUserByChannel(db, 'telegram', String(ctx.chat.id))
    if (!userId) {
      await ctx.reply(linkPrompt)
      return
    }

    await ctx.replyWithChatAction('typing').catch(() => {})

    try {
      const reply = await runAgentTurn({
        conversationId: conversationId(ctx),
        userId,
        channel: 'telegram',
        parts: [{ text }],
      })
      await ctx.reply(reply)
    } catch (err) {
      logger.warn({ err }, 'telegram agent failed, pakai regex fallback')
      await replyWithRegexFallback(ctx, db, userId, text)
    }
  })

  bot.on('message:photo', async (ctx) => {
    const db = getDb()
    const userId = await resolveUserByChannel(db, 'telegram', String(ctx.chat.id))
    if (!userId) {
      await ctx.reply(linkPrompt)
      return
    }

    const photo = ctx.message.photo.at(-1)
    if (!photo) return

    await ctx.replyWithChatAction('typing').catch(() => {})
    try {
      const media = await downloadFileAsBase64(ctx, photo.file_id)
      if (!media) {
        await ctx.reply('Gagal ambil fotonya. Coba kirim ulang ya.')
        return
      }
      const caption = ctx.message.caption ?? 'Ini struk gue, tolong baca dan ajuin buat dicatat.'
      const reply = await runAgentTurn({
        conversationId: conversationId(ctx),
        userId,
        channel: 'telegram',
        mediaKind: 'photo',
        parts: [{ inlineData: { mimeType: media.mimeType, data: media.data } }, { text: caption }],
      })
      await ctx.reply(reply)
    } catch (err) {
      logger.error({ err }, 'telegram photo ocr failed')
      await ctx.reply('Lagi gagal baca struknya nih. Coba lagi atau catat manual aja dulu ya.')
    }
  })

  bot.on('message:video', async (ctx) => {
    const db = getDb()
    const userId = await resolveUserByChannel(db, 'telegram', String(ctx.chat.id))
    if (!userId) {
      await ctx.reply(linkPrompt)
      return
    }

    const video = ctx.message.video
    if (video.file_size && video.file_size > MAX_MEDIA_BYTES) {
      await ctx.reply('Videonya kegedean (maks 20MB). Coba kirim yang lebih pendek ya.')
      return
    }

    await ctx.replyWithChatAction('typing').catch(() => {})
    try {
      const file = await ctx.api.getFile(video.file_id)
      if (!file.file_path) {
        await ctx.reply('Gagal ambil videonya. Coba kirim ulang ya.')
        return
      }
      const token = loadEnv().TELEGRAM_BOT_TOKEN
      const res = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`)
      if (!res.ok) {
        await ctx.reply('Gagal ambil videonya. Coba kirim ulang ya.')
        return
      }
      const data = Buffer.from(await res.arrayBuffer()).toString('base64')
      const caption =
        ctx.message.caption ?? 'Ini video struk gue, tolong baca dan ajuin buat dicatat.'
      const reply = await runAgentTurn({
        conversationId: conversationId(ctx),
        userId,
        channel: 'telegram',
        mediaKind: 'video',
        parts: [
          { inlineData: { mimeType: video.mime_type ?? 'video/mp4', data } },
          { text: caption },
        ],
      })
      await ctx.reply(reply)
    } catch (err) {
      logger.error({ err }, 'telegram video ocr failed')
      await ctx.reply('Lagi gagal baca videonya nih. Coba lagi atau catat manual aja dulu ya.')
    }
  })

  bot.catch((err) => {
    logger.error({ err: err.error }, 'telegram bot error')
  })
}

async function replyWithRegexFallback(
  ctx: Context,
  db: ReturnType<typeof getDb>,
  userId: string,
  text: string,
): Promise<void> {
  const parsed = parseQuickAddText(text)
  if (!parsed) {
    await ctx.reply('Lagi rada lemot nih otak gue. Coba lagi, atau tulis kayak "makan 35rb" ya.')
    return
  }
  const recorded = await recordChatTransaction(db, userId, parsed, text, 'telegram')
  const verb = recorded.kind === 'income' ? 'masuk' : 'kepake'
  await ctx.reply(
    `Sip, ${formatRupiah(recorded.amount)} ${verb} di ${capitalize(recorded.categoryName)} (${recorded.walletName}). Cek di app kalo mau ralat.`,
  )
}
