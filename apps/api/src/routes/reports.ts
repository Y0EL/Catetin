import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { summaryQuerySchema } from '@catetin/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import { getMonthSummary } from '../services/transaction-service'

export const reportsRouter = new Hono<AppEnv>()
reportsRouter.use('*', requireAuth)

reportsRouter.get('/summary', zValidator('query', summaryQuerySchema), async (c) => {
  const db = getDb()
  const { month } = c.req.valid('query')
  const summary = await getMonthSummary(db, c.get('userId'), month)
  return c.json({ ok: true, summary })
})
