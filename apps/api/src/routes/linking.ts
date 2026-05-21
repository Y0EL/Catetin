import { Hono } from 'hono'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { loadEnv } from '../env'
import { requireAuth } from '../middleware/auth'
import { createLinkingCode, listLinkedChannels } from '../services/linking-service'

export const linkingRouter = new Hono<AppEnv>()
linkingRouter.use('*', requireAuth)

linkingRouter.get('/status', async (c) => {
  const db = getDb()
  const status = await listLinkedChannels(db, c.get('userId'))
  return c.json({ ok: true, ...status })
})

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
