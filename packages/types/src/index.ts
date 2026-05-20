import { z } from 'zod'

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL_VISION: z.string().default('gemini-1.5-flash'),
  GEMINI_MODEL_CHAT: z.string().default('gemini-2.0-flash-exp'),
  GEMINI_LIVE_MODEL: z.string().default('gemini-2.0-flash-live-001'),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(8),
  REVENUECAT_API_KEY_IOS: z.string().optional(),
  REVENUECAT_API_KEY_ANDROID: z.string().optional(),
  REVENUECAT_WEBHOOK_AUTH: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_BASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export const walletTypeSchema = z.enum(['cash', 'bank', 'ewallet', 'credit', 'other'])
export const categoryKindSchema = z.enum(['expense', 'income'])
export const transactionKindSchema = z.enum(['expense', 'income', 'transfer'])
export const transactionSourceSchema = z.enum([
  'mobile',
  'telegram',
  'whatsapp',
  'ocr_photo',
  'ocr_video',
  'manual_chat',
])
export const confidenceSchema = z.enum(['high', 'medium', 'low'])
export const budgetPeriodSchema = z.enum(['monthly', 'weekly'])
export const channelSchema = z.enum(['telegram', 'whatsapp'])

export const createTransactionSchema = z.object({
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  kind: transactionKindSchema,
  amount: z.number().int().nonnegative(),
  description: z.string().max(500).optional(),
  merchant: z.string().max(200).optional(),
  occurredAt: z.string().datetime(),
  source: transactionSourceSchema.default('mobile'),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

export const ocrReceiptResponseSchema = z.object({
  merchant: z.string().nullable(),
  date: z.string().nullable(),
  items: z.array(
    z.object({
      name: z.string(),
      qty: z.number().int().positive().default(1),
      price: z.number().int().nonnegative(),
      category: z.string(),
    }),
  ),
  total: z.number().int().nonnegative(),
  confidence: confidenceSchema,
})

export type OcrReceiptResponse = z.infer<typeof ocrReceiptResponseSchema>

export const createWalletSchema = z.object({
  name: z.string().min(1).max(50),
  type: walletTypeSchema,
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  initialBalance: z.number().int().default(0),
})

export type CreateWalletInput = z.infer<typeof createWalletSchema>

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  period: budgetPeriodSchema,
  amount: z.number().int().positive(),
  alertThreshold: z.number().int().min(1).max(100).default(80),
  startsAt: z.string().date(),
})

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>

export const validCategoryNames = [
  'makanan',
  'minuman',
  'transportasi',
  'belanja',
  'tagihan',
  'hiburan',
  'kesehatan',
  'pendidikan',
  'lainnya',
] as const

export type ValidCategoryName = (typeof validCategoryNames)[number]
