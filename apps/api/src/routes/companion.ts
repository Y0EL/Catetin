import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { endCompanionSessionSchema } from '@catetin/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import {
  endCompanionSession,
  getCompanionQuota,
  startCompanionSession,
} from '../services/companion-service'

export const companionRouter = new Hono<AppEnv>()
companionRouter.use('*', requireAuth)

companionRouter.get('/quota', async (c) => {
  const db = getDb()
  const quota = await getCompanionQuota(db, c.get('userId'))
  return c.json({ ok: true, quota })
})

companionRouter.post('/start', async (c) => {
  const db = getDb()
  const session = await startCompanionSession(db, c.get('userId'))
  return c.json({ ok: true, ...session })
})

companionRouter.post('/end', zValidator('json', endCompanionSessionSchema), async (c) => {
  const db = getDb()
  await endCompanionSession(db, c.get('userId'), c.req.valid('json').sessionId)
  return c.json({ ok: true })
})
