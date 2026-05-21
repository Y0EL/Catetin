import { useEffect, useId, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg'

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

function spikePath(count: number, c: number, rInner: number, rOuter: number): string {
  let d = ''
  for (let i = 0; i < count; i += 1) {
    const aOuter = (i / count) * Math.PI * 2 - Math.PI / 2
    const aInner = ((i + 0.5) / count) * Math.PI * 2 - Math.PI / 2
    const ro = rOuter * (0.72 + 0.28 * Math.abs(Math.sin(i * 1.7 + 0.5)))
    const ox = c + Math.cos(aOuter) * ro
    const oy = c + Math.sin(aOuter) * ro
    const ix = c + Math.cos(aInner) * rInner
    const iy = c + Math.sin(aInner) * rInner
    d += `${i === 0 ? 'M' : 'L'} ${ox.toFixed(1)} ${oy.toFixed(1)} L ${ix.toFixed(1)} ${iy.toFixed(1)} `
  }
  return `${d}Z`
}

type SpikeStop = { offset: string; color: string; opacity: number }

type SpikesSpec = {
  box: number
  count: number
  rInner: number
  rOuter: number
  duration: number
  reverse?: boolean
  opacity: number
  stops: SpikeStop[]
}

function Spikes({ box, count, rInner, rOuter, duration, reverse, opacity, stops }: SpikesSpec) {
  const id = useId().replace(/:/g, '')
  const rot = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    loop.start()
    return () => loop.stop()
  }, [rot, duration])

  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg'],
  })
  const d = spikePath(count, box / 2, rInner, rOuter)

  return (
    <Animated.View style={{ position: 'absolute', opacity, transform: [{ rotate }] }}>
      <Svg width={box} height={box}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {stops.map((s, i) => (
              <Stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
            ))}
          </LinearGradient>
        </Defs>
        <Path d={d} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  )
}

const blobs: BlobSpec[] = [
  { color: '#6366f1', size: 220, from: { x: -50, y: -40 }, to: { x: 40, y: 30 }, duration: 5200 },
  { color: '#ec4899', size: 200, from: { x: 140, y: 70 }, to: { x: 70, y: -20 }, duration: 6800 },
  { color: '#22d3ee', size: 180, from: { x: 20, y: 80 }, to: { x: 120, y: 20 }, duration: 8200 },
]

export function CardGlow() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {blobs.map((b, i) => (
        <Blob key={i} {...b} />
      ))}
      <View style={{ position: 'absolute', right: -60, top: -110 }}>
        <Spikes
          box={340}
          count={16}
          rInner={52}
          rOuter={165}
          duration={26000}
          opacity={0.4}
          stops={[
            { offset: '0', color: '#818cf8', opacity: 0.9 },
            { offset: '0.5', color: '#c084fc', opacity: 0.7 },
            { offset: '1', color: '#f472b6', opacity: 0.6 },
          ]}
        />
        <Spikes
          box={340}
          count={26}
          rInner={34}
          rOuter={140}
          duration={34000}
          reverse
          opacity={0.32}
          stops={[
            { offset: '0', color: '#22d3ee', opacity: 0.9 },
            { offset: '0.6', color: '#6366f1', opacity: 0.6 },
            { offset: '1', color: '#a855f7', opacity: 0.5 },
          ]}
        />
      </View>
    </View>
  )
}
