import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { loadEnv } from './env'
import { logger } from './logger'
import { healthRouter } from './routes/health'
import { createTelegramBot } from './telegram/bot'

const env = loadEnv()

const app = new Hono()

app.onError((err, c) => {
  logger.error({ err, path: c.req.path }, 'unhandled error')
  return c.json({ ok: false, code: 'INTERNAL' }, 500)
})

app.notFound((c) => c.json({ ok: false, code: 'NOT_FOUND' }, 404))

app.route('/health', healthRouter)

const bot = createTelegramBot(env.TELEGRAM_BOT_TOKEN)

bot.start({
  drop_pending_updates: true,
  onStart: (info) => logger.info({ username: info.username }, 'Telegram bot polling started'),
})

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info({ port: info.port }, 'Catetin API listening')
})

process.on('SIGINT', async () => {
  logger.info('Shutting down')
  await bot.stop()
  process.exit(0)
})
