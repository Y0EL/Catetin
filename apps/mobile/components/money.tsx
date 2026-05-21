import { Text, View } from 'react-native'

type Size = 'hero' | 'lg' | 'md' | 'sm'
type Tone = 'default' | 'onDark' | 'income' | 'expense' | 'invert'

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
  if (abs >= 1_000_000_000_000) return `${truncTo1(abs / 1_000_000_000_000)}triliun`
  if (abs >= 1_000_000_000) return `${truncTo1(abs / 1_000_000_000)}miliar`
  if (abs >= 1_000_000) return `${truncTo1(abs / 1_000_000)}jt`
  return abs.toLocaleString('id-ID', { maximumFractionDigits: 0 })
}

function formatParts(value: number, compact: boolean): { sign: string; digits: string } {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  const digits = compact
    ? compactRupiah(abs)
    : abs.toLocaleString('id-ID', { maximumFractionDigits: 0 })
  return { sign, digits }
}

export function Money({
  value,
  size = 'md',
  tone = 'default',
  compact = false,
}: {
  value: number
  size?: Size
  tone?: Tone
  compact?: boolean
}) {
  const { sign, digits } = formatParts(value, compact)
  const numColor =
    tone === 'invert'
      ? 'text-white dark:text-zinc-900'
      : tone === 'onDark'
        ? 'text-white'
        : tone === 'income'
          ? 'text-success'
          : 'text-zinc-900 dark:text-zinc-100'
  const rpColor =
    tone === 'invert'
      ? 'text-primary-200 dark:text-zinc-400'
      : tone === 'onDark'
        ? 'text-primary-200'
        : 'text-zinc-400 dark:text-zinc-500'

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
