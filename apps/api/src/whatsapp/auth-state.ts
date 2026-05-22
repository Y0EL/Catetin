import { eq } from 'drizzle-orm'
import {
  BufferJSON,
  initAuthCreds,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataTypeMap,
} from 'baileys'
import { whatsappSessions, type Database } from '@catetin/db'

type KeyType = keyof SignalDataTypeMap

type KeysShape = Partial<Record<KeyType, Record<string, unknown>>>

type SerializedSession = {
  creds: AuthenticationCreds
  keys: KeysShape
}

function deepJsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, BufferJSON.replacer), BufferJSON.reviver) as T
}

async function loadSession(db: Database, userId: string): Promise<SerializedSession> {
  const rows = await db
    .select({ creds: whatsappSessions.creds, keys: whatsappSessions.keys })
    .from(whatsappSessions)
    .where(eq(whatsappSessions.userId, userId))
    .limit(1)
  const row = rows[0]
  if (!row || !row.creds) return { creds: initAuthCreds(), keys: {} }
  const raw = JSON.stringify({ creds: row.creds, keys: row.keys ?? {} })
  return JSON.parse(raw, BufferJSON.reviver) as SerializedSession
}

async function persistSession(
  db: Database,
  userId: string,
  data: SerializedSession,
): Promise<void> {
  const serialized = JSON.parse(JSON.stringify(data, BufferJSON.replacer)) as SerializedSession
  await db
    .insert(whatsappSessions)
    .values({
      userId,
      creds: serialized.creds,
      keys: serialized.keys,
    })
    .onConflictDoUpdate({
      target: whatsappSessions.userId,
      set: { creds: serialized.creds, keys: serialized.keys },
    })
}

export async function makeDbAuthState(
  db: Database,
  userId: string,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const session = await loadSession(db, userId)

  const state: AuthenticationState = {
    creds: session.creds,
    keys: {
      get: async (type, ids) => {
        const bucket = (session.keys[type] ?? {}) as Record<string, unknown>
        const out: Record<string, unknown> = {}
        for (const id of ids) {
          if (id in bucket) out[id] = bucket[id]
        }
        return out as never
      },
      set: async (data) => {
        for (const rawType of Object.keys(data)) {
          const type = rawType as KeyType
          const incoming = (data as Record<string, Record<string, unknown> | undefined>)[type]
          if (!incoming) continue
          const current = (session.keys[type] ?? {}) as Record<string, unknown>
          const next: Record<string, unknown> = { ...current }
          for (const id of Object.keys(incoming)) {
            const value = incoming[id]
            if (value === null || value === undefined) {
              delete next[id]
            } else {
              next[id] = value
            }
          }
          session.keys[type] = next
        }
        await persistSession(db, userId, session)
      },
    },
  }

  const saveCreds = async () => {
    await persistSession(db, userId, session)
  }

  return { state, saveCreds }
}

export async function clearAuthState(db: Database, userId: string): Promise<void> {
  await db.delete(whatsappSessions).where(eq(whatsappSessions.userId, userId))
}

export function _internalDeepClone<T>(value: T): T {
  return deepJsonClone(value)
}
