import { Hono } from 'hono'
import type { AppEnv } from '../context'
import { requireAuth } from '../middleware/auth'
import { getPairingStatus, startPairing, unlinkUser } from '../whatsapp/manager'

export const whatsappRouter = new Hono<AppEnv>()
whatsappRouter.use('*', requireAuth)

whatsappRouter.post('/pair', async (c) => {
  const result = await startPairing(c.get('userId'))
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
