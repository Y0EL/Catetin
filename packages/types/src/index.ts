import { z } from 'zod'

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL_VISION: z.string().default('gemini-2.5-flash'),
  GEMINI_MODEL_CHAT: z.string().default('gemini-2.5-flash'),
  GEMINI_LIVE_MODEL: z.string().default('gemini-2.0-flash-live-001'),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(8),
  TELEGRAM_BOT_USERNAME: z.string().default('catetindobot'),
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

export const updateTransactionSchema = z.object({
  walletId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  kind: transactionKindSchema.optional(),
  amount: z.number().int().nonnegative().optional(),
  description: z.string().max(500).optional(),
  merchant: z.string().max(200).optional(),
  occurredAt: z.string().datetime().optional(),
})

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>

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

export const ocrRequestSchema = z.object({
  image: z.string().min(1),
  mimeType: z.string().default('image/jpeg'),
})

export type OcrRequest = z.infer<typeof ocrRequestSchema>

export const createWalletSchema = z.object({
  name: z.string().min(1).max(50),
  type: walletTypeSchema,
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
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

export const updateBudgetSchema = z.object({
  amount: z.number().int().positive().optional(),
  alertThreshold: z.number().int().min(1).max(100).optional(),
  period: budgetPeriodSchema.optional(),
})

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>

export const budgetWithStatusSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  period: budgetPeriodSchema,
  amount: z.number().int().nonnegative(),
  alertThreshold: z.number().int(),
  spent: z.number().int().nonnegative(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
})

export type BudgetWithStatus = z.infer<typeof budgetWithStatusSchema>

export const createCategorySchema = z.object({
  name: z.string().min(1).max(40),
  kind: categoryKindSchema,
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const listTransactionsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  category: z.string().uuid().optional(),
  wallet: z.string().uuid().optional(),
  q: z.string().max(120).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>

export const summaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
})

export type SummaryQuery = z.infer<typeof summaryQuerySchema>

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  locale: z.string(),
  isSubscribed: z.boolean(),
})

export type UserProfile = z.infer<typeof userProfileSchema>

export const walletSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: walletTypeSchema,
  icon: z.string().nullable(),
  color: z.string().nullable(),
  initialBalance: z.number(),
  isArchived: z.boolean(),
})

export type Wallet = z.infer<typeof walletSchema>

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: categoryKindSchema,
  icon: z.string().nullable(),
  color: z.string().nullable(),
  isPreset: z.boolean(),
})

export type Category = z.infer<typeof categorySchema>

export const transactionSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  kind: transactionKindSchema,
  amount: z.number(),
  description: z.string().nullable(),
  merchant: z.string().nullable(),
  occurredAt: z.string(),
  source: transactionSourceSchema,
})

export type TransactionDto = z.infer<typeof transactionSchema>

export const categoryTotalSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string(),
  total: z.number(),
})

export const monthSummarySchema = z.object({
  month: z.string(),
  income: z.number(),
  expense: z.number(),
  net: z.number(),
  byCategory: z.array(categoryTotalSchema),
})

export type MonthSummary = z.infer<typeof monthSummarySchema>

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
