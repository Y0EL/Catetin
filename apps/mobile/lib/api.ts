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

export async function apiStream(
  path: string,
  body: unknown,
  onChunk: (data: string) => void,
): Promise<void> {
  const token = await getCurrentIdToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) throw new ApiError(res.status, 'STREAM_ERROR')
  if (!res.body) return
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data: ')) onChunk(line.slice(6))
    }
  }
}

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'UNAUTHORIZED') return 'Sesi lo abis, coba login ulang ya.'
    if (err.code === 'NOT_FOUND') return 'Datanya gak ketemu.'
    if (err.code === 'VALIDATION_ERROR') return 'Ada isian yang belum bener.'
  }
  return 'Sinyal lagi ngambek. Coba lagi yuk.'
}
