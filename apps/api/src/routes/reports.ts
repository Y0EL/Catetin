import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { flexTrendQuerySchema, summaryQuerySchema } from '@catetin/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import { buildMonthlyCsv } from '../services/csv-service'
import { buildMonthlyPdf } from '../services/pdf-service'
import { getFlexTrend, getMonthSummary } from '../services/transaction-service'

export const reportsRouter = new Hono<AppEnv>()
reportsRouter.use('*', requireAuth)

reportsRouter.get('/summary', zValidator('query', summaryQuerySchema), async (c) => {
  const db = getDb()
  const { month } = c.req.valid('query')
  const summary = await getMonthSummary(db, c.get('userId'), month)
  return c.json({ ok: true, summary })
})

reportsRouter.get('/trend', zValidator('query', flexTrendQuerySchema), async (c) => {
  const db = getDb()
  const { period, from, to } = c.req.valid('query')

  const now = new Date()
  const cy = now.getUTCFullYear()
  const cm = now.getUTCMonth() + 1

  let resolvedFrom = from
  let resolvedTo = to

  if (!resolvedFrom || !resolvedTo) {
    if (period === 'daily' || period === 'weekly') {
      const lastDay = new Date(Date.UTC(cy, cm, 0)).getUTCDate()
      resolvedFrom = `${cy}-${String(cm).padStart(2, '0')}-01`
      resolvedTo = `${cy}-${String(cm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    } else if (period === 'monthly') {
      const lastDay = new Date(Date.UTC(cy, cm, 0)).getUTCDate()
      const fd = new Date(Date.UTC(cy, cm - 7, 1))
      resolvedFrom = `${fd.getUTCFullYear()}-${String(fd.getUTCMonth() + 1).padStart(2, '0')}-01`
      resolvedTo = `${cy}-${String(cm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    } else {
      resolvedFrom = `${cy}-01-01`
      resolvedTo = `${cy}-12-31`
    }
  }

  const trend = await getFlexTrend(db, c.get('userId'), period, resolvedFrom, resolvedTo)
  return c.json({ ok: true, trend })
})

reportsRouter.get('/csv', zValidator('query', summaryQuerySchema), async (c) => {
  const db = getDb()
  const { month } = c.req.valid('query')
  const csv = await buildMonthlyCsv(db, c.get('userId'), month)
  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="catetin-${month}.csv"`)
  return c.body(csv)
})

reportsRouter.get('/pdf', zValidator('query', summaryQuerySchema), async (c) => {
  const db = getDb()
  const { month } = c.req.valid('query')
  const pdf = await buildMonthlyPdf(db, c.get('userId'), month)
  c.header('Content-Type', 'application/pdf')
  c.header('Content-Disposition', `attachment; filename="catetin-${month}.pdf"`)
  return c.body(new Uint8Array(pdf))
})
