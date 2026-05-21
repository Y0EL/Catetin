import { Text, View } from 'react-native'
import Svg, { G, Rect } from 'react-native-svg'
import type { TrendItem } from '@catetin/types'

const CHART_HEIGHT = 160
const LABEL_HEIGHT = 22
const BAR_WIDTH = 12
const BAR_GAP = 3

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
  if (data.length === 0 || width <= 0) {
    return <View style={{ height: CHART_HEIGHT, width }} />
  }
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]))
  const groupWidth = BAR_WIDTH * 2 + BAR_GAP
  const slotWidth = width / data.length
  const chartArea = CHART_HEIGHT - LABEL_HEIGHT

  return (
    <View style={{ width, height: CHART_HEIGHT }}>
      <Svg width={width} height={chartArea}>
        {data.map((d, i) => {
          const slotX = i * slotWidth
          const groupX = slotX + (slotWidth - groupWidth) / 2
          const incomeH = (d.income / max) * (chartArea - 8)
          const expenseH = (d.expense / max) * (chartArea - 8)
          return (
            <G key={d.month}>
              <Rect
                x={groupX}
                y={chartArea - incomeH}
                width={BAR_WIDTH}
                height={incomeH}
                fill="#16a34a"
                rx={3}
              />
              <Rect
                x={groupX + BAR_WIDTH + BAR_GAP}
                y={chartArea - expenseH}
                width={BAR_WIDTH}
                height={expenseH}
                fill="#ef4444"
                rx={3}
              />
            </G>
          )
        })}
      </Svg>
      <View
        style={{
          flexDirection: 'row',
          height: LABEL_HEIGHT,
          alignItems: 'center',
        }}
      >
        {data.map((d) => (
          <View key={d.month} style={{ width: slotWidth, alignItems: 'center' }}>
            <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
              {monthLabel(d.month)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
