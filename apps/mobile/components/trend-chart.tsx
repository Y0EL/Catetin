import { useId } from 'react'
import { Text, View } from 'react-native'
import Svg, { Defs, G, LinearGradient, Line, Rect, Stop } from 'react-native-svg'
import type { TrendItem } from '@catetin/types'

const TOTAL_HEIGHT = 180
const LABEL_HEIGHT = 22
const ZERO_LINE_INSET = 6
const BAR_WIDTH = 10
const CORNER_RADIUS = 5

const MONTH_NAMES = [
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

function monthLabel(yyyymm: string): string {
  const month = Number.parseInt(yyyymm.slice(5, 7), 10)
  return MONTH_NAMES[month - 1] ?? yyyymm.slice(5, 7)
}

export function TrendChart({ data, width }: { data: TrendItem[]; width: number }) {
  const incomeGradId = useId().replace(/:/g, '')
  const expenseGradId = useId().replace(/:/g, '')

  if (data.length === 0 || width <= 0) {
    return <View style={{ height: TOTAL_HEIGHT, width }} />
  }

  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]))
  const chartArea = TOTAL_HEIGHT - LABEL_HEIGHT
  const half = chartArea / 2
  const incomeArea = half - ZERO_LINE_INSET
  const expenseArea = half - ZERO_LINE_INSET
  const zeroY = half
  const slotWidth = width / data.length

  return (
    <View style={{ width, height: TOTAL_HEIGHT }}>
      <Svg width={width} height={chartArea}>
        <Defs>
          <LinearGradient id={incomeGradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#22c55e" stopOpacity="1" />
            <Stop offset="1" stopColor="#22c55e" stopOpacity="0.4" />
          </LinearGradient>
          <LinearGradient id={expenseGradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ef4444" stopOpacity="0.4" />
            <Stop offset="1" stopColor="#ef4444" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Line
          x1={0}
          x2={width}
          y1={zeroY}
          y2={zeroY}
          stroke="#e4e4e7"
          strokeWidth={1}
          strokeDasharray="3 3"
        />

        {data.map((d, i) => {
          const isLast = i === data.length - 1
          const opacity = isLast ? 1 : 0.7
          const slotX = i * slotWidth
          const barX = slotX + (slotWidth - BAR_WIDTH) / 2
          const incomeH = (d.income / max) * incomeArea
          const expenseH = (d.expense / max) * expenseArea
          return (
            <G key={d.month} opacity={opacity}>
              {incomeH > 0 ? (
                <Rect
                  x={barX}
                  y={zeroY - ZERO_LINE_INSET - incomeH}
                  width={BAR_WIDTH}
                  height={incomeH}
                  rx={CORNER_RADIUS}
                  fill={`url(#${incomeGradId})`}
                />
              ) : null}
              {expenseH > 0 ? (
                <Rect
                  x={barX}
                  y={zeroY + ZERO_LINE_INSET}
                  width={BAR_WIDTH}
                  height={expenseH}
                  rx={CORNER_RADIUS}
                  fill={`url(#${expenseGradId})`}
                />
              ) : null}
            </G>
          )
        })}
      </Svg>
      <View style={{ flexDirection: 'row', height: LABEL_HEIGHT, alignItems: 'center' }}>
        {data.map((d, i) => {
          const isLast = i === data.length - 1
          return (
            <View key={d.month} style={{ width: slotWidth, alignItems: 'center' }}>
              <Text
                className={
                  isLast
                    ? 'font-sans text-xs font-bold text-zinc-900 dark:text-zinc-100'
                    : 'font-sans text-xs text-zinc-400 dark:text-zinc-500'
                }
              >
                {monthLabel(d.month)}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
