import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { wallets } from '@catetin/db'
import { createWalletSchema } from '@catetin/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toWalletDto } from '../dto'
import { HttpError } from '../errors'
import { requireAuth } from '../middleware/auth'

export const walletsRouter = new Hono<AppEnv>()
walletsRouter.use('*', requireAuth)

walletsRouter.get('/', async (c) => {
  const db = getDb()
  const rows = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.userId, c.get('userId')), eq(wallets.isArchived, false)))
  return c.json({ ok: true, wallets: rows.map(toWalletDto) })
})

walletsRouter.post('/', zValidator('json', createWalletSchema), async (c) => {
  const db = getDb()
  const input = c.req.valid('json')
  const rows = await db
    .insert(wallets)
    .values({
      userId: c.get('userId'),
      name: input.name,
      type: input.type,
      icon: input.icon ?? null,
      color: input.color ?? null,
      initialBalance: input.initialBalance,
    })
    .returning()
  return c.json({ ok: true, wallet: toWalletDto(rows[0]!) }, 201)
})

walletsRouter.delete('/:id', async (c) => {
  const db = getDb()
  const rows = await db
    .update(wallets)
    .set({ isArchived: true })
    .where(and(eq(wallets.id, c.req.param('id')), eq(wallets.userId, c.get('userId'))))
    .returning({ id: wallets.id })
  if (rows.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Wallet gak ketemu')
  return c.json({ ok: true })
})
