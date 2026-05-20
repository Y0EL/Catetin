import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'
import { loadEnv } from './env'

let cached: App | null = null

export function getFirebaseAdmin(): App {
  if (cached) return cached
  const existing = getApps()
  if (existing.length > 0) {
    cached = existing[0]!
    return cached
  }
  const env = loadEnv()
  cached = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
  return cached
}

export function verifyIdToken(token: string): Promise<DecodedIdToken> {
  return getAuth(getFirebaseAdmin()).verifyIdToken(token)
}
