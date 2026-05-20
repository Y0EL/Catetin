import { eq } from 'drizzle-orm'
import { users, type Database } from '@catetin/db'

export type AuthClaims = {
  firebaseUid: string
  email: string | null
  name: string | null
}

export async function upsertUserByFirebase(db: Database, claims: AuthClaims): Promise<string> {
  const rows = await db
    .insert(users)
    .values({
      firebaseUid: claims.firebaseUid,
      email: claims.email,
      name: claims.name,
    })
    .onConflictDoUpdate({
      target: users.firebaseUid,
      set: { email: claims.email, name: claims.name },
    })
    .returning({ id: users.id })
  return rows[0]!.id
}

export async function getUserProfile(db: Database, userId: string) {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      locale: users.locale,
      isSubscribed: users.isSubscribed,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return rows[0] ?? null
}
