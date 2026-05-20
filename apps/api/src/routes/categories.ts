import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { categories } from '@catetin/db'
import { createCategorySchema } from '@catetin/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toCategoryDto } from '../dto'
import { requireAuth } from '../middleware/auth'

export const categoriesRouter = new Hono<AppEnv>()
categoriesRouter.use('*', requireAuth)

categoriesRouter.get('/', async (c) => {
  const db = getDb()
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, c.get('userId')))
  return c.json({ ok: true, categories: rows.map(toCategoryDto) })
})

categoriesRouter.post('/', zValidator('json', createCategorySchema), async (c) => {
  const db = getDb()
  const input = c.req.valid('json')
  const rows = await db
    .insert(categories)
    .values({
      userId: c.get('userId'),
      name: input.name,
      kind: input.kind,
      icon: input.icon ?? null,
      color: input.color ?? null,
      isPreset: false,
    })
    .returning()
  return c.json({ ok: true, category: toCategoryDto(rows[0]!) }, 201)
})
