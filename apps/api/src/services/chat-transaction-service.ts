import { and, asc, eq } from 'drizzle-orm'
import { categories, transactions, wallets, type Database } from '@catetin/db'
import type { ParsedTextTransaction } from '@catetin/chat-core'
import { HttpError } from '../errors'
import { checkBudgetAlerts } from './budget-alert-service'
import { ensureUserDefaults } from './seed-service'

export type ChatSource = 'telegram' | 'whatsapp'
export type TransactionSource = ChatSource | 'ocr_photo' | 'ocr_video'

export type RecordedChatTransaction = {
  kind: 'expense' | 'income'
  amount: number
  description: string
  categoryName: string
  walletName: string
}

export type AgentTransactionInput = {
  amount: number
  deskripsi: string
  kategori: string
  jenis: 'pengeluaran' | 'pemasukan'
  occurredAt?: string
}

const INCOME_KEYWORDS = ['gaji', 'gajian', 'bonus', 'thr', 'pemasukan', 'dividen', 'cuan', 'untung']

function looksLikeIncome(rawText: string): boolean {
  const lower = rawText.toLowerCase()
  return INCOME_KEYWORDS.some((kw) => lower.includes(kw))
}

async function findCategory(
  db: Database,
  userId: string,
  name: string,
  kind: 'expense' | 'income',
): Promise<{ id: string; name: string } | null> {
  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.name, name), eq(categories.kind, kind)))
    .limit(1)
  return rows[0] ?? null
}

async function pickDefaultWallet(
  db: Database,
  userId: string,
): Promise<{ id: string; name: string } | null> {
  const rows = await db
    .select({ id: wallets.id, name: wallets.name })
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.isArchived, false)))
    .orderBy(asc(wallets.createdAt))
    .limit(1)
  return rows[0] ?? null
}

async function insertTransaction(
  db: Database,
  userId: string,
  values: {
    kind: 'expense' | 'income'
    amount: number
    description: string
    categoryName: string
    fallbackCategory: string
    occurredAt: Date
    source: TransactionSource
  },
): Promise<RecordedChatTransaction> {
  await ensureUserDefaults(db, userId)

  const category =
    (await findCategory(db, userId, values.categoryName.toLowerCase(), values.kind)) ??
    (await findCategory(db, userId, values.fallbackCategory, values.kind))
  if (!category) throw new HttpError(500, 'INTERNAL', 'Kategori default gak ketemu')

  const wallet = await pickDefaultWallet(db, userId)
  if (!wallet) throw new HttpError(500, 'INTERNAL', 'Wallet default gak ketemu')

  const amount = Math.round(values.amount)
  await db.insert(transactions).values({
    userId,
    walletId: wallet.id,
    categoryId: category.id,
    kind: values.kind,
    amount,
    description: values.description,
    occurredAt: values.occurredAt,
    source: values.source,
  })

  void checkBudgetAlerts(db, userId, category.id, values.kind, amount).catch(() => {})

  return {
    kind: values.kind,
    amount,
    description: values.description,
    categoryName: category.name,
    walletName: wallet.name,
  }
}

export async function recordChatTransaction(
  db: Database,
  userId: string,
  parsed: ParsedTextTransaction,
  rawText: string,
  source: ChatSource,
): Promise<RecordedChatTransaction> {
  const isIncome = looksLikeIncome(rawText)
  const kind: 'expense' | 'income' = isIncome ? 'income' : 'expense'
  return insertTransaction(db, userId, {
    kind,
    amount: parsed.amount,
    description: parsed.description,
    categoryName: isIncome ? 'pemasukan lain' : parsed.category,
    fallbackCategory: isIncome ? 'pemasukan lain' : 'lainnya',
    occurredAt: new Date(),
    source,
  })
}

export async function saveAgentTransaction(
  db: Database,
  userId: string,
  input: AgentTransactionInput,
  source: TransactionSource,
): Promise<RecordedChatTransaction> {
  const kind: 'expense' | 'income' = input.jenis === 'pemasukan' ? 'income' : 'expense'
  return insertTransaction(db, userId, {
    kind,
    amount: input.amount,
    description: input.deskripsi,
    categoryName: input.kategori,
    fallbackCategory: kind === 'income' ? 'pemasukan lain' : 'lainnya',
    occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    source,
  })
}
