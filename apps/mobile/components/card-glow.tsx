import { useId } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'

type GlowPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center'

const anchors: Record<GlowPosition, { cx: string; cy: string }> = {
  topLeft: { cx: '22%', cy: '14%' },
  topRight: { cx: '82%', cy: '12%' },
  bottomLeft: { cx: '18%', cy: '88%' },
  bottomRight: { cx: '85%', cy: '85%' },
  center: { cx: '50%', cy: '50%' },
}

export function CardGlow({
  position = 'topRight',
  intensity = 1,
  radius = '70%',
}: {
  position?: GlowPosition
  intensity?: number
  radius?: string
}) {
  const id = useId().replace(/:/g, '')
  const { cx, cy } = anchors[position]

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx={cx} cy={cy} r={radius}>
            <Stop offset="0" stopColor="#818cf8" stopOpacity={0.55 * intensity} />
            <Stop offset="0.4" stopColor="#a855f7" stopOpacity={0.3 * intensity} />
            <Stop offset="0.7" stopColor="#ec4899" stopOpacity={0.14 * intensity} />
            <Stop offset="1" stopColor="#ec4899" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  )
}
