import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { registerPushTokenSchema } from '@catetin/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import { saveExpoPushToken, sendPushToUser } from '../services/push-service'

export const notifRouter = new Hono<AppEnv>()
notifRouter.use('*', requireAuth)

notifRouter.post('/register-token', zValidator('json', registerPushTokenSchema), async (c) => {
  const db = getDb()
  const { token } = c.req.valid('json')
  await saveExpoPushToken(db, c.get('userId'), token)
  return c.json({ ok: true })
})

notifRouter.post('/test', async (c) => {
  const db = getDb()
  const ticket = await sendPushToUser(db, c.get('userId'), {
    title: 'Halo dari Catetin',
    body: 'Notif lo udah aktif. Yuk catat hari ini.',
  })
  return c.json({ ok: true, sent: ticket !== null })
})
