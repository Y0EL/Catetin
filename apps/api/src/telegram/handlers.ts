import { formatRupiah, parseQuickAddText } from '@catetin/chat-core'
import type { Bot } from 'grammy'
import { logger } from '../logger'

const welcomeMessage = [
  'Hai, gue Catetin. Anggep aja temen yang inget pengeluaran lo.',
  '',
  'Cara catat. Tinggal kirim teks kayak gini.',
  '  makan 35rb',
  '  kopi 25000',
  '  gojek 18k ke kantor',
  '  gaji 5jt',
  '',
  'Atau kirim foto struk, nanti gue baca otomatis (soon).',
].join('\n')

const helpMessage = [
  'Format teks. <deskripsi> <angka>[rb|k|jt|juta]',
  'Contoh.',
  '  makan 35rb',
  '  kopi 25000',
  '  transport 12,5rb',
  '',
  'Kategori auto-detect dari kata kunci. Kalau gak ke detect, masuk lainnya.',
].join('\n')

export function registerHandlers(bot: Bot) {
  bot.command('start', async (ctx) => {
    await ctx.reply(welcomeMessage)
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(helpMessage)
  })

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text
    if (text.startsWith('/')) return

    const parsed = parseQuickAddText(text)
    if (!parsed) {
      await ctx.reply('Hmm, gak ke detect angkanya. Coba kayak "makan 35rb" ya.')
      return
    }

    const lines = [
      'Tercatat.',
      `${capitalize(parsed.description)} ${formatRupiah(parsed.amount)}`,
      `Kategori: ${capitalize(parsed.category)}`,
    ]

    if (parsed.confidence === 'low') {
      lines.push('')
      lines.push('Catatan: kategori belum ketemu, defaulted ke lainnya. Edit di app kalau perlu.')
    }

    await ctx.reply(lines.join('\n'))

    logger.info(
      {
        chatId: ctx.chat.id,
        amount: parsed.amount,
        category: parsed.category,
        confidence: parsed.confidence,
      },
      'parsed quick add',
    )
  })

  bot.on('message:photo', async (ctx) => {
    await ctx.reply('OCR struk masih dalam pengembangan. Sementara catat manual dulu ya.')
  })

  bot.catch((err) => {
    logger.error({ err: err.error }, 'telegram bot error')
  })
}

function capitalize(text: string): string {
  if (text.length === 0) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}
