import { Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { formatRupiah } from '@catetin/chat-core'

const SIZE = 160
const CX = SIZE / 2
const CY = SIZE / 2
const OUTER_R = 68
const INNER_R = 46
const GAP_DEG = 2

export type DonutSlice = { name: string; total: number; color: string }

function polarToCart(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const os = polarToCart(cx, cy, outerR, startDeg)
  const oe = polarToCart(cx, cy, outerR, endDeg)
  const ie = polarToCart(cx, cy, innerR, endDeg)
  const is_ = polarToCart(cx, cy, innerR, startDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${os.x.toFixed(2)} ${os.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x.toFixed(2)} ${oe.y.toFixed(2)}`,
    `L ${ie.x.toFixed(2)} ${ie.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${is_.x.toFixed(2)} ${is_.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

export function DonutChart({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const nonZero = slices.filter((s) => s.total > 0)

  if (nonZero.length === 0) {
    return (
      <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Text className="font-sans text-xs text-zinc-400">Belum ada data</Text>
      </View>
    )
  }

  const sum = nonZero.reduce((acc, s) => acc + s.total, 0)
  let currentDeg = 0

  const paths = nonZero.map((slice) => {
    const sliceDeg = (slice.total / sum) * 360
    const start = currentDeg + GAP_DEG / 2
    const end = currentDeg + sliceDeg - GAP_DEG / 2
    currentDeg += sliceDeg
    if (end <= start) return null
    return { path: arcPath(CX, CY, OUTER_R, INNER_R, start, end), color: slice.color }
  })

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        {paths.map((p, i) => (p ? <Path key={i} d={p.path} fill={p.color} /> : null))}
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text className="font-sans text-[10px] uppercase tracking-widest text-zinc-400">
          Pengeluaran
        </Text>
        <Text className="font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
          {formatRupiah(total)}
        </Text>
      </View>
    </View>
  )
}
