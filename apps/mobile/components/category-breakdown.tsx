import { Text, View } from 'react-native'
import { formatRupiah } from '@catetin/chat-core'
import { getCategoryMeta, type CategoryKey } from '~/lib/categories'

type Slice = { name: string; total: number }

export function CategoryBreakdown({ slices, max = 5 }: { slices: Slice[]; max?: number }) {
  const top = slices.slice(0, max)
  const total = top.reduce((s, x) => s + x.total, 0)
  if (top.length === 0) return null
  const biggest = Math.max(1, ...top.map((s) => s.total))

  return (
    <View className="gap-3">
      {top.map((slice) => {
        const meta = getCategoryMeta(slice.name as CategoryKey)
        const pct = total > 0 ? Math.round((slice.total / total) * 100) : 0
        const fillPct = Math.round((slice.total / biggest) * 100)
        return (
          <View key={slice.name}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.tint }} />
                <Text className="font-sans text-sm font-medium capitalize text-zinc-700 dark:text-zinc-200">
                  {slice.name}
                </Text>
              </View>
              <View className="flex-row items-baseline gap-2">
                <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">{pct}%</Text>
                <Text className="font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatRupiah(slice.total)}
                </Text>
              </View>
            </View>
            <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <View style={{ width: `${fillPct}%`, backgroundColor: meta.tint, height: '100%' }} />
            </View>
          </View>
        )
      })}
    </View>
  )
}
