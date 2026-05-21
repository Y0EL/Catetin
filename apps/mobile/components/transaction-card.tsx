import { Text, View } from 'react-native'
import { Money } from '~/components/money'
import { getCategoryMeta, type CategoryKey } from '~/lib/categories'

type Props = {
  category: CategoryKey
  title: string
  wallet: string
  amount: number
  kind: 'expense' | 'income'
  time: string
}

export function TransactionCard({ category, title, wallet, amount, kind, time }: Props) {
  const meta = getCategoryMeta(category)
  const Icon = meta.icon
  const signed = kind === 'expense' ? -Math.abs(amount) : Math.abs(amount)

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
        <Money value={signed} size="md" tone={kind === 'income' ? 'income' : 'default'} />
        <Text className="mt-0.5 font-sans text-xs text-zinc-400">{time}</Text>
      </View>
    </View>
  )
}
