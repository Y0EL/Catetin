import { eq } from 'drizzle-orm'
import { categories, wallets, type Database } from '@catetin/db'
import { DEFAULT_WALLET, PRESET_EXPENSE_CATEGORIES, PRESET_INCOME_CATEGORIES } from '../constants'

export async function ensureUserDefaults(db: Database, userId: string): Promise<void> {
  const existingCategory = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1)

  if (existingCategory.length === 0) {
    const rows = [
      ...PRESET_EXPENSE_CATEGORIES.map((c) => ({
        userId,
        name: c.name,
        kind: 'expense' as const,
        icon: c.icon,
        color: c.color,
        isPreset: true,
      })),
      ...PRESET_INCOME_CATEGORIES.map((c) => ({
        userId,
        name: c.name,
        kind: 'income' as const,
        icon: c.icon,
        color: c.color,
        isPreset: true,
      })),
    ]
    await db.insert(categories).values(rows)
  }

  const existingWallet = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1)

  if (existingWallet.length === 0) {
    await db.insert(wallets).values({
      userId,
      name: DEFAULT_WALLET.name,
      type: DEFAULT_WALLET.type,
      icon: DEFAULT_WALLET.icon,
      color: DEFAULT_WALLET.color,
      initialBalance: 0,
    })
  }
}
