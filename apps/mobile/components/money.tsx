import { Text, View } from 'react-native'

type Size = 'hero' | 'lg' | 'md' | 'sm'
type Tone = 'default' | 'onDark' | 'income' | 'expense'

const sizes: Record<Size, { rp: string; num: string }> = {
  hero: { rp: 'text-base', num: 'text-5xl' },
  lg: { rp: 'text-xs', num: 'text-2xl' },
  md: { rp: 'text-[10px]', num: 'text-lg' },
  sm: { rp: 'text-[10px]', num: 'text-sm' },
}

function truncTo1(value: number): string {
  const floored = Math.floor(value * 10) / 10
  return floored.toLocaleString('id-ID', { maximumFractionDigits: 1 })
}

function compactRupiah(abs: number): string {
  if (abs >= 1_000_000_000) return `${truncTo1(abs / 1_000_000_000)}miliar`
  if (abs >= 1_000_000) return `${truncTo1(abs / 1_000_000)}jt`
  return abs.toLocaleString('id-ID', { maximumFractionDigits: 0 })
}

function formatParts(value: number): { sign: string; digits: string } {
  const sign = value < 0 ? '-' : ''
  return { sign, digits: compactRupiah(Math.abs(value)) }
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
