import {
  BufferJSON,
  initAuthCreds,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataTypeMap,
} from '@whiskeysockets/baileys'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

type KeyType = keyof SignalDataTypeMap

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(file, 'utf-8')
    return JSON.parse(raw, BufferJSON.reviver) as T
  } catch {
    return fallback
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await writeFile(file, JSON.stringify(data, BufferJSON.replacer), 'utf-8')
}

export async function makeFileAuthState(dir: string): Promise<{
  state: AuthenticationState
  saveCreds: () => Promise<void>
}> {
  await mkdir(dir, { recursive: true })
  const keysDir = path.join(dir, 'keys')
  await mkdir(keysDir, { recursive: true })

  const credsFile = path.join(dir, 'creds.json')
  const creds = await readJson<AuthenticationCreds>(credsFile, initAuthCreds())

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type, ids) => {
        const file = path.join(keysDir, `${type}.json`)
        const data = await readJson<Record<string, unknown>>(file, {})
        const out: Record<string, unknown> = {}
        for (const id of ids) {
          if (id in data) out[id] = data[id]
        }
        return out as never
      },
      set: async (data) => {
        for (const rawType of Object.keys(data)) {
          const type = rawType as KeyType
          const incoming = (data as Record<string, Record<string, unknown> | undefined>)[type]
          if (!incoming) continue
          const file = path.join(keysDir, `${type}.json`)
          const current = await readJson<Record<string, unknown>>(file, {})
          const next: Record<string, unknown> = { ...current }
          for (const id of Object.keys(incoming)) {
            const val = incoming[id]
            if (val === null || val === undefined) {
              delete next[id]
            } else {
              next[id] = val
            }
          }
          await writeJson(file, next)
        }
      },
    },
  }

  return {
    state,
    saveCreds: () => writeJson(credsFile, state.creds),
  }
}
