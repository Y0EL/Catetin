import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { companionTurnSchema, endCompanionSessionSchema } from '@catetin/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import { clearCompanionHistory, runCompanionTurn } from '../services/companion-agent-service'
import {
  assertSessionOwnedAndActive,
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

companionRouter.post('/turn', zValidator('json', companionTurnSchema), async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const { sessionId, audio, mimeType } = c.req.valid('json')
  await assertSessionOwnedAndActive(db, userId, sessionId)
  const result = await runCompanionTurn({
    userId,
    sessionId,
    audio: { data: audio, mimeType },
  })
  return c.json({ ok: true, text: result.text })
})

companionRouter.post('/end', zValidator('json', endCompanionSessionSchema), async (c) => {
  const db = getDb()
  const { sessionId } = c.req.valid('json')
  await endCompanionSession(db, c.get('userId'), sessionId)
  clearCompanionHistory(sessionId)
  return c.json({ ok: true })
})
