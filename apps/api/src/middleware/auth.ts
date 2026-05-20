import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { HttpError } from '../errors'
import { verifyIdToken } from '../firebase'
import { upsertUserByFirebase } from '../services/user-service'

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Token gak ada')
  }

  const token = header.slice('Bearer '.length).trim()
  const decoded = await verifyIdToken(token).catch(() => null)
  if (!decoded) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Token gak valid')
  }

  const email = typeof decoded.email === 'string' ? decoded.email : null
  const rawName = decoded['name']
  const name = typeof rawName === 'string' ? rawName : null

  const userId = await upsertUserByFirebase(getDb(), {
    firebaseUid: decoded.uid,
    email,
    name,
  })

  c.set('userId', userId)
  c.set('firebaseUid', decoded.uid)
  await next()
})
