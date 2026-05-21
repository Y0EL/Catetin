import { useEffect, useId, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'

type BlobSpec = {
  color: string
  size: number
  from: { x: number; y: number }
  to: { x: number; y: number }
  duration: number
}

function Blob({ color, size, from, to, duration }: BlobSpec) {
  const id = useId().replace(/:/g, '')
  const t = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [t, duration])

  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [from.x, to.x] })
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [from.y, to.y] })
  const scale = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.25, 1] })

  return (
    <Animated.View
      style={{ position: 'absolute', transform: [{ translateX }, { translateY }, { scale }] }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity="0.7" />
            <Stop offset="0.55" stopColor={color} stopOpacity="0.2" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  )
}

const blobs: BlobSpec[] = [
  { color: '#6366f1', size: 240, from: { x: -60, y: -50 }, to: { x: 50, y: 30 }, duration: 5200 },
  { color: '#ec4899', size: 210, from: { x: 150, y: 70 }, to: { x: 70, y: -30 }, duration: 6800 },
  { color: '#22d3ee', size: 190, from: { x: 30, y: 90 }, to: { x: 160, y: 30 }, duration: 8200 },
  { color: '#8b5cf6', size: 220, from: { x: 120, y: -40 }, to: { x: 30, y: 60 }, duration: 7400 },
  { color: '#34d399', size: 170, from: { x: -30, y: 60 }, to: { x: 90, y: -20 }, duration: 9000 },
]

export function CardGlow() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {blobs.map((b, i) => (
        <Blob key={i} {...b} />
      ))}
    </View>
  )
}
