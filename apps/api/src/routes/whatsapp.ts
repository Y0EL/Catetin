import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../context'
import { requireAuth } from '../middleware/auth'
import { getPairingStatus, startPairing, unlinkUser } from '../whatsapp/manager'

export const whatsappRouter = new Hono<AppEnv>()
whatsappRouter.use('*', requireAuth)

const pairSchema = z.object({
  phoneNumber: z
    .string()
    .min(8)
    .transform((v) => v.replace(/\D/g, '')),
})

whatsappRouter.post('/pair', zValidator('json', pairSchema), async (c) => {
  const { phoneNumber } = c.req.valid('json')
  const result = await startPairing(c.get('userId'), phoneNumber)
  return c.json({ ok: true, ...result })
})

whatsappRouter.get('/status', (c) => {
  const result = getPairingStatus(c.get('userId'))
  return c.json({ ok: true, ...result })
})

whatsappRouter.post('/unlink', async (c) => {
  await unlinkUser(c.get('userId'))
  return c.json({ ok: true })
})
