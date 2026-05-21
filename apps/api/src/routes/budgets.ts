import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createBudgetSchema, updateBudgetSchema } from '@catetin/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import {
  createBudget,
  deleteBudget,
  listBudgetsWithStatus,
  updateBudget,
} from '../services/budget-service'

export const budgetsRouter = new Hono<AppEnv>()
budgetsRouter.use('*', requireAuth)

budgetsRouter.get('/', async (c) => {
  const db = getDb()
  const items = await listBudgetsWithStatus(db, c.get('userId'))
  return c.json({ ok: true, budgets: items })
})

budgetsRouter.post('/', zValidator('json', createBudgetSchema), async (c) => {
  const db = getDb()
  const budget = await createBudget(db, c.get('userId'), c.req.valid('json'))
  return c.json({ ok: true, budget }, 201)
})

budgetsRouter.patch('/:id', zValidator('json', updateBudgetSchema), async (c) => {
  const db = getDb()
  const budget = await updateBudget(db, c.get('userId'), c.req.param('id'), c.req.valid('json'))
  return c.json({ ok: true, budget })
})

budgetsRouter.delete('/:id', async (c) => {
  const db = getDb()
  await deleteBudget(db, c.get('userId'), c.req.param('id'))
  return c.json({ ok: true })
})
