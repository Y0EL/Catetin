import { useEffect, useId, useRef } from 'react'
import { Animated, Easing, Pressable, StyleSheet } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg'

type Props = {
  size?: number
  active?: boolean
  onPress?: () => void
}

export function CatetinOrb({ size = 250, active = false, onPress }: Props) {
  const frame = size * 1.35
  const ringId = useId().replace(/:/g, '')
  const glowId = useId().replace(/:/g, '')
  const pulse = useRef(new Animated.Value(0)).current
  const spin = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loops: Animated.CompositeAnimation[] = []
    if (active) {
      const p = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      )
      const s = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 7000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      )
      loops.push(p, s)
      loops.forEach((l) => l.start())
    } else {
      pulse.stopAnimation()
      pulse.setValue(0)
      spin.stopAnimation()
      spin.setValue(0)
    }
    return () => loops.forEach((l) => l.stop())
  }, [active, pulse, spin])

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.14] })
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [active ? 0.55 : 0.32, 0.9],
  })
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  const stroke = size * 0.05
  const r = (size - stroke) / 2
  const center = size / 2

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? 'Hentikan obrolan' : 'Mulai ngobrol dengan Catetin'}
      onPress={onPress}
      style={{ width: frame, height: frame, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { alignItems: 'center', justifyContent: 'center' },
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      >
        <Svg width={frame} height={frame}>
          <Defs>
            <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#818cf8" stopOpacity="0.5" />
              <Stop offset="0.45" stopColor="#a855f7" stopOpacity="0.24" />
              <Stop offset="0.75" stopColor="#ec4899" stopOpacity="0.1" />
              <Stop offset="1" stopColor="#ec4899" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={frame / 2} cy={frame / 2} r={frame / 2} fill={`url(#${glowId})`} />
        </Svg>
      </Animated.View>

      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#f4f4f5" />
              <Stop offset="0.45" stopColor="#52525b" />
              <Stop offset="1" stopColor="#18181b" />
            </LinearGradient>
          </Defs>
          <Circle cx={center} cy={center} r={r} stroke="#1c1c1f" strokeWidth={stroke} fill="none" />
          <Circle
            cx={center}
            cy={center}
            r={r}
            stroke={`url(#${ringId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </Pressable>
  )
}
