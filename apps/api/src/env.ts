import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { serverEnvSchema, type ServerEnv } from '@catetin/types'

const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '../../../.env')

try {
  process.loadEnvFile(envPath)
} catch {
  // .env not present is acceptable when env is provided by the host
}

let cached: ServerEnv | null = null

export function loadEnv(): ServerEnv {
  if (cached) return cached
  const parsed = serverEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Invalid environment configuration\n${issues}`)
  }
  cached = parsed.data
  return cached
}
