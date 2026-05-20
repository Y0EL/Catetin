import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { categories, wallets } from '@catetin/db'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toCategoryDto, toWalletDto } from '../dto'
import { HttpError } from '../errors'
import { requireAuth } from '../middleware/auth'
import { ensureUserDefaults } from '../services/seed-service'
import { getUserProfile } from '../services/user-service'

export const authRouter = new Hono<AppEnv>()
authRouter.use('*', requireAuth)

authRouter.post('/session', async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  await ensureUserDefaults(db, userId)

  const profile = await getUserProfile(db, userId)
  if (!profile) throw new HttpError(404, 'NOT_FOUND', 'User gak ketemu')

  const walletRows = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.isArchived, false)))
  const categoryRows = await db.select().from(categories).where(eq(categories.userId, userId))

  return c.json({
    ok: true,
    user: profile,
    wallets: walletRows.map(toWalletDto),
    categories: categoryRows.map(toCategoryDto),
  })
})
