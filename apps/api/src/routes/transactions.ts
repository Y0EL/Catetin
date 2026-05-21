import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  bulkDeleteTransactionsSchema,
  createTransactionSchema,
  listTransactionsQuerySchema,
  updateTransactionSchema,
} from '@catetin/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toTransactionDto } from '../dto'
import { requireAuth } from '../middleware/auth'
import {
  bulkDeleteTransactions,
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
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

transactionsRouter.patch('/:id', zValidator('json', updateTransactionSchema), async (c) => {
  const db = getDb()
  const tx = await updateTransaction(db, c.get('userId'), c.req.param('id'), c.req.valid('json'))
  return c.json({ ok: true, transaction: toTransactionDto(tx) })
})

transactionsRouter.post(
  '/bulk-delete',
  zValidator('json', bulkDeleteTransactionsSchema),
  async (c) => {
    const db = getDb()
    const { ids } = c.req.valid('json')
    const deleted = await bulkDeleteTransactions(db, c.get('userId'), ids)
    return c.json({ ok: true, deleted })
  },
)

transactionsRouter.delete('/:id', async (c) => {
  const db = getDb()
  await deleteTransaction(db, c.get('userId'), c.req.param('id'))
  return c.json({ ok: true })
})
