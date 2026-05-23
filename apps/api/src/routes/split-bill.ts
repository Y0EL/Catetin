import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import { logger } from '../logger'
import { saveAgentTransaction } from '../services/chat-transaction-service'
import { runSplitBillTurn, type SplitResult } from '../services/split-bill-service'

export const splitBillRouter = new Hono<AppEnv>()
splitBillRouter.use('*', requireAuth)

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(z.object({ role: z.string(), content: z.string() }))
    .max(40)
    .default([]),
})

const recordSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().max(500).default('Split tagihan'),
})

splitBillRouter.post('/chat', zValidator('json', chatSchema), async (c) => {
  const { message, history } = c.req.valid('json')

  return streamSSE(c, async (stream) => {
    let splitResult: SplitResult | null = null

    try {
      await runSplitBillTurn(
        message,
        history,
        async (chunk) => {
          await stream.writeSSE({ data: JSON.stringify({ chunk }) })
        },
        async (result) => {
          splitResult = result
          await stream.writeSSE({ data: JSON.stringify({ splitResult: result }) })
        },
      )
      await stream.writeSSE({ data: JSON.stringify({ done: true, splitResult }) })
    } catch (err) {
      logger.error({ err }, 'split bill chat error')
      await stream.writeSSE({ data: JSON.stringify({ error: 'Gagal memproses.' }) })
    }
  })
})

splitBillRouter.post('/record', zValidator('json', recordSchema), async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const { amount, description } = c.req.valid('json')

  const saved = await saveAgentTransaction(
    db,
    userId,
    { amount, deskripsi: description, kategori: 'lainnya', jenis: 'pengeluaran' },
    'split_bill',
  )

  return c.json({ ok: true, id: saved.kind })
})
