import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createTransactionSchema, listTransactionsQuerySchema } from '@catetin/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toTransactionDto } from '../dto'
import { requireAuth } from '../middleware/auth'
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
} from '../services/transaction-service'

export const transactionsRouter = new Hono<AppEnv>()
transactionsRouter.use('*', requireAuth)

transactionsRouter.get('/', zValidator('query', listTransactionsQuerySchema), async (c) => {
  const db = getDb()
  const result = await listTransactions(db, c.get('userId'), c.req.valid('query'))
  return c.json({
    ok: true,
    transactions: result.rows.map(toTransactionDto),
    nextCursor: result.nextCursor,
  })
})

transactionsRouter.post('/', zValidator('json', createTransactionSchema), async (c) => {
  const db = getDb()
  const tx = await createTransaction(db, c.get('userId'), c.req.valid('json'))
  return c.json({ ok: true, transaction: toTransactionDto(tx) }, 201)
})

transactionsRouter.delete('/:id', async (c) => {
  const db = getDb()
  await deleteTransaction(db, c.get('userId'), c.req.param('id'))
  return c.json({ ok: true })
})
