export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'PAYMENT_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL'

export class HttpError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly details: unknown

  constructor(status: number, code: ErrorCode, message?: string, details?: unknown) {
    super(message ?? code)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}
