import type {
  Category as CategoryRow,
  Transaction as TransactionRow,
  Wallet as WalletRow,
} from '@catetin/db'
import type { Category, TransactionDto, Wallet } from '@catetin/types'

export function toWalletDto(r: WalletRow): Wallet {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    icon: r.icon,
    color: r.color,
    initialBalance: r.initialBalance,
    isArchived: r.isArchived,
  }
}

export function toCategoryDto(r: CategoryRow): Category {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    icon: r.icon,
    color: r.color,
    isPreset: r.isPreset,
  }
}

export function toTransactionDto(r: TransactionRow): TransactionDto {
  return {
    id: r.id,
    walletId: r.walletId,
    categoryId: r.categoryId,
    kind: r.kind,
    amount: r.amount,
    description: r.description,
    merchant: r.merchant,
    occurredAt: r.occurredAt.toISOString(),
    source: r.source,
  }
}
