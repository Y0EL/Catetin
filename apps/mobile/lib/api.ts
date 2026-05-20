import { getCurrentIdToken } from './auth'

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(status: number, code: string, message?: string) {
    super(message ?? code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

type ApiBody = { ok?: boolean; code?: string; message?: string } | null

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getCurrentIdToken()
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  const body = (await res.json().catch(() => null)) as ApiBody

  if (!res.ok || !body || body.ok === false) {
    throw new ApiError(res.status, body?.code ?? 'INTERNAL', body?.message)
  }
  return body as T
}

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'UNAUTHORIZED') return 'Sesi lo abis, coba login ulang ya.'
    if (err.code === 'NOT_FOUND') return 'Datanya gak ketemu.'
    if (err.code === 'VALIDATION_ERROR') return 'Ada isian yang belum bener.'
  }
  return 'Sinyal lagi ngambek. Coba lagi yuk.'
}
