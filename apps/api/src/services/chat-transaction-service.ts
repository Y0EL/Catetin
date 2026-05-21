import { and, asc, eq } from 'drizzle-orm'
import { categories, transactions, wallets, type Database } from '@catetin/db'
import type { ParsedTextTransaction } from '@catetin/chat-core'
import { HttpError } from '../errors'
import { ensureUserDefaults } from './seed-service'

export type ChatSource = 'telegram' | 'whatsapp'

export type RecordedChatTransaction = {
  kind: 'expense' | 'income'
  amount: number
  description: string
  categoryName: string
  walletName: string
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

export async function recordChatTransaction(
  db: Database,
  userId: string,
  parsed: ParsedTextTransaction,
  rawText: string,
  source: ChatSource,
): Promise<RecordedChatTransaction> {
  await ensureUserDefaults(db, userId)

  const isIncome = looksLikeIncome(rawText)
  const kind: 'expense' | 'income' = isIncome ? 'income' : 'expense'
  const wantedName = isIncome ? 'pemasukan lain' : parsed.category
  const fallbackName = isIncome ? 'pemasukan lain' : 'lainnya'

  const category =
    (await findCategory(db, userId, wantedName, kind)) ??
    (await findCategory(db, userId, fallbackName, kind))
  if (!category) throw new HttpError(500, 'INTERNAL', 'Kategori default gak ketemu')

  const walletRows = await db
    .select({ id: wallets.id, name: wallets.name })
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.isArchived, false)))
    .orderBy(asc(wallets.createdAt))
    .limit(1)
  const wallet = walletRows[0]
  if (!wallet) throw new HttpError(500, 'INTERNAL', 'Wallet default gak ketemu')

  await db.insert(transactions).values({
    userId,
    walletId: wallet.id,
    categoryId: category.id,
    kind,
    amount: parsed.amount,
    description: parsed.description,
    occurredAt: new Date(),
    source,
  })

  return {
    kind,
    amount: parsed.amount,
    description: parsed.description,
    categoryName: category.name,
    walletName: wallet.name,
  }
}
