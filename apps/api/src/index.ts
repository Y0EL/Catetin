import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ZodError } from 'zod'
import { loadEnv } from './env'
import { HttpError } from './errors'
import { logger } from './logger'
import { authRouter } from './routes/auth'
import { budgetsRouter } from './routes/budgets'
import { categoriesRouter } from './routes/categories'
import { healthRouter } from './routes/health'
import { linkingRouter } from './routes/linking'
import { notifRouter } from './routes/notif'
import { ocrRouter } from './routes/ocr'
import { reportsRouter } from './routes/reports'
import { transactionsRouter } from './routes/transactions'
import { walletsRouter } from './routes/wallets'
import { createTelegramBot } from './telegram/bot'

const env = loadEnv()

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
  }),
)

app.onError((err, c) => {
  if (err instanceof HttpError) {
    const body =
      err.details !== undefined
        ? { ok: false as const, code: err.code, details: err.details }
        : { ok: false as const, code: err.code }
    return c.json(body, err.status as ContentfulStatusCode)
  }
  if (err instanceof ZodError) {
    return c.json({ ok: false, code: 'VALIDATION_ERROR', details: err.issues }, 400)
  }
  logger.error({ err, path: c.req.path }, 'unhandled error')
  return c.json({ ok: false, code: 'INTERNAL' }, 500)
})

app.notFound((c) => c.json({ ok: false, code: 'NOT_FOUND' }, 404))

app.route('/health', healthRouter)
app.route('/v1/auth', authRouter)
app.route('/v1/wallets', walletsRouter)
app.route('/v1/categories', categoriesRouter)
app.route('/v1/transactions', transactionsRouter)
app.route('/v1/reports', reportsRouter)
app.route('/v1/linking', linkingRouter)
app.route('/v1/ocr', ocrRouter)
app.route('/v1/budgets', budgetsRouter)
app.route('/v1/notif', notifRouter)

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
