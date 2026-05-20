import { Text, View } from 'react-native'
import { getCategoryMeta, type CategoryKey } from '~/lib/categories'

type Props = {
  category: CategoryKey
  title: string
  wallet: string
  amount: number
  kind: 'expense' | 'income'
  time: string
}

function formatRupiah(amount: number): string {
  return `Rp ${Math.abs(amount).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
}

export function TransactionCard({ category, title, wallet, amount, kind, time }: Props) {
  const meta = getCategoryMeta(category)
  const Icon = meta.icon
  const sign = kind === 'expense' ? '-' : '+'
  const amountColor = kind === 'expense' ? 'text-zinc-900 dark:text-zinc-100' : 'text-success'

  return (
    <View className="flex-row items-center gap-3 py-3">
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: meta.soft }}
      >
        <Icon size={20} color={meta.tint} />
      </View>
      <View className="flex-1">
        <Text className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </Text>
        <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">
          {wallet} {'·'} {meta.label}
        </Text>
      </View>
      <View className="items-end">
        <Text
          className={`font-display text-base font-semibold ${amountColor}`}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {sign}
          {formatRupiah(amount)}
        </Text>
        <Text className="mt-0.5 font-sans text-xs text-zinc-400">{time}</Text>
      </View>
    </View>
  )
}
