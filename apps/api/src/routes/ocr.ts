import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { ocrRequestSchema } from '@catetin/types'
import type { AppEnv } from '../context'
import { requireAuth } from '../middleware/auth'
import { readReceipt } from '../services/ocr-service'

export const ocrRouter = new Hono<AppEnv>()
ocrRouter.use('*', requireAuth)

ocrRouter.post('/receipt', zValidator('json', ocrRequestSchema), async (c) => {
  const { image, mimeType } = c.req.valid('json')
  const draft = await readReceipt(image, mimeType)
  return c.json({ ok: true, draft })
})
