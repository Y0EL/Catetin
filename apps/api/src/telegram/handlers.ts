import { formatRupiah, parseQuickAddText } from '@catetin/chat-core'
import type { Bot } from 'grammy'
import { getDb } from '../db'
import { logger } from '../logger'
import { recordChatTransaction } from '../services/chat-transaction-service'
import { consumeLinkingCode, resolveUserByChannel } from '../services/linking-service'

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
  'Tinggal catat. Kirim teks kayak gini.',
  '  makan 35rb',
  '  kopi 25000',
  '  gojek 18k ke kantor',
  '  gaji 5jt',
  '',
  'Semuanya langsung masuk ke Catetin lo.',
].join('\n')

const helpMessage = [
  'Format teks. <deskripsi> <angka>[rb|k|jt|juta]',
  'Contoh.',
  '  makan 35rb',
  '  kopi 25000',
  '  transport 12,5rb',
  '',
  'Kalau ada kata gaji, bonus, atau thr, gue catat sebagai pemasukan.',
  'Kategori auto-detect dari kata kunci. Kalau gak ketemu, masuk lainnya.',
].join('\n')

function capitalize(text: string): string {
  if (text.length === 0) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
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
      await ctx.reply('Chat ini udah kesambung ke akun Catetin. Langsung catat aja.')
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
    const externalId = String(ctx.chat.id)
    const userId = await resolveUserByChannel(db, 'telegram', externalId)
    if (!userId) {
      await ctx.reply(linkPrompt)
      return
    }

    const parsed = parseQuickAddText(text)
    if (!parsed) {
      await ctx.reply('Hmm, gak ke detect angkanya. Coba kayak "makan 35rb" ya.')
      return
    }

    const recorded = await recordChatTransaction(db, userId, parsed, text, 'telegram')
    const sign = recorded.kind === 'income' ? '+' : '-'
    const lines = [
      recorded.kind === 'income' ? 'Pemasukan tercatat.' : 'Tercatat.',
      `${capitalize(recorded.description)} ${sign}${formatRupiah(recorded.amount)}`,
      `Kategori: ${capitalize(recorded.categoryName)} - ${recorded.walletName}`,
    ]
    if (parsed.confidence === 'low' && recorded.kind === 'expense') {
      lines.push('')
      lines.push('Catatan: kategori belum ketemu, masuk lainnya. Edit di app kalau perlu.')
    }
    await ctx.reply(lines.join('\n'))

    logger.info(
      { externalId, userId, amount: recorded.amount, kind: recorded.kind },
      'telegram transaction recorded',
    )
  })

  bot.on('message:photo', async (ctx) => {
    await ctx.reply('OCR struk masih dalam pengembangan. Sementara catat manual dulu ya.')
  })

  bot.catch((err) => {
    logger.error({ err: err.error }, 'telegram bot error')
  })
}
