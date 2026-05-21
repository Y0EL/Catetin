import { Hono } from 'hono'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { loadEnv } from '../env'
import { requireAuth } from '../middleware/auth'
import { createLinkingCode } from '../services/linking-service'

export const linkingRouter = new Hono<AppEnv>()
linkingRouter.use('*', requireAuth)

linkingRouter.post('/code', async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const { code, expiresAt } = await createLinkingCode(db, userId)
  const env = loadEnv()

  return c.json({
    ok: true,
    code,
    telegramUrl: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${code}`,
    expiresAt: expiresAt.toISOString(),
  })
})
