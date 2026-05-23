import { useId } from 'react'
import { Text, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import type { FlexTrendItem } from '@catetin/types'

const CHART_H = 160
const H_PAD = 20
const TOP_PAD = 20
const BOT_PAD = 4
const DOT_R = 4

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

function formatLabel(label: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): string {
  if (period === 'daily') return String(parseInt(label.slice(8), 10))
  if (period === 'weekly') {
    const d = new Date(label + 'T00:00:00Z')
    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`
  }
  const m = parseInt(label.slice(5, 7), 10)
  return MONTH_ABBR[m - 1] ?? label.slice(5, 7)
}

function shouldShowLabel(
  i: number,
  n: number,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly',
): boolean {
  if (period === 'daily') return i === 0 || (i + 1) % 7 === 0 || i === n - 1
  if (period === 'yearly') return i % 2 === 0
  return true
}

export function LineChart({
  data,
  width,
  period,
}: {
  data: FlexTrendItem[]
  width: number
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
}) {
  const incGradId = useId().replace(/:/g, '')
  const expGradId = useId().replace(/:/g, '')

  if (data.length === 0 || width <= 0) return <View style={{ height: CHART_H + 24, width }} />

  const n = data.length
  const maxVal = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]))
  const plotW = width - 2 * H_PAD
  const plotH = CHART_H - TOP_PAD - BOT_PAD

  function xPos(i: number) {
    return n <= 1 ? H_PAD + plotW / 2 : H_PAD + (i / (n - 1)) * plotW
  }
  function yPos(v: number) {
    return TOP_PAD + (1 - v / maxVal) * plotH
  }

  function linePath(points: { x: number; y: number }[]): string {
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ')
  }

  function areaPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return ''
    const bottom = CHART_H - BOT_PAD
    const first = points[0]!
    const last = points[points.length - 1]!
    const inner = points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    return `M ${first.x.toFixed(1)} ${bottom} ${inner} L ${last.x.toFixed(1)} ${bottom} Z`
  }

  const incPts = data.map((d, i) => ({ x: xPos(i), y: yPos(d.income) }))
  const expPts = data.map((d, i) => ({ x: xPos(i), y: yPos(d.expense) }))

  return (
    <View style={{ width }}>
      <Svg width={width} height={CHART_H}>
        <Defs>
          <LinearGradient id={incGradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#22c55e" stopOpacity="0.25" />
            <Stop offset="1" stopColor="#22c55e" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id={expGradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ef4444" stopOpacity="0.25" />
            <Stop offset="1" stopColor="#ef4444" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Path d={areaPath(incPts)} fill={`url(#${incGradId})`} />
        <Path d={areaPath(expPts)} fill={`url(#${expGradId})`} />
        <Path
          d={linePath(incPts)}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={linePath(expPts)}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {incPts.map((p, i) => (
          <Circle
            key={`i${i}`}
            cx={p.x}
            cy={p.y}
            r={DOT_R}
            fill="white"
            stroke="#22c55e"
            strokeWidth="1.5"
          />
        ))}
        {expPts.map((p, i) => (
          <Circle
            key={`e${i}`}
            cx={p.x}
            cy={p.y}
            r={DOT_R}
            fill="white"
            stroke="#ef4444"
            strokeWidth="1.5"
          />
        ))}
      </Svg>

      <View style={{ flexDirection: 'row', height: 20, position: 'relative' }}>
        {data.map((d, i) => {
          if (!shouldShowLabel(i, n, period)) return null
          const x = xPos(i)
          return (
            <View
              key={d.label}
              style={{ position: 'absolute', left: x - 16, width: 32, alignItems: 'center' }}
            >
              <Text className="font-sans text-[10px] text-zinc-400 dark:text-zinc-500">
                {formatLabel(d.label, period)}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
