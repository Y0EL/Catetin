import { Text, View } from 'react-native'

type Size = 'hero' | 'lg' | 'md' | 'sm'
type Tone = 'default' | 'onDark' | 'income' | 'expense'

const sizes: Record<Size, { rp: string; num: string }> = {
  hero: { rp: 'text-base', num: 'text-5xl' },
  lg: { rp: 'text-xs', num: 'text-2xl' },
  md: { rp: 'text-[10px]', num: 'text-lg' },
  sm: { rp: 'text-[10px]', num: 'text-sm' },
}

function formatParts(value: number): { sign: string; digits: string } {
  const sign = value < 0 ? '-' : ''
  const digits = Math.abs(value).toLocaleString('id-ID', { maximumFractionDigits: 0 })
  return { sign, digits }
}

export function Money({
  value,
  size = 'md',
  tone = 'default',
}: {
  value: number
  size?: Size
  tone?: Tone
}) {
  const { sign, digits } = formatParts(value)
  const numColor =
    tone === 'onDark'
      ? 'text-white'
      : tone === 'income'
        ? 'text-success'
        : 'text-zinc-900 dark:text-zinc-100'
  const rpColor = tone === 'onDark' ? 'text-primary-200' : 'text-zinc-400 dark:text-zinc-500'

  return (
    <View className="flex-row items-baseline">
      <Text className={`font-sans font-medium ${sizes[size].rp} ${rpColor}`}>{sign}Rp </Text>
      <Text
        className={`font-display font-extrabold ${sizes[size].num} ${numColor}`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {digits}
      </Text>
    </View>
  )
}
