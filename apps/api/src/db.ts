import { createDatabase, type Database } from '@catetin/db'
import { loadEnv } from './env'

let cached: Database | null = null

export function getDb(): Database {
  if (cached) return cached
  const env = loadEnv()
  cached = createDatabase(env.DATABASE_URL)
  return cached
}
