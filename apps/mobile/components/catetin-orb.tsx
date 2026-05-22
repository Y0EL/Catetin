import { useId, useEffect } from 'react'
import { Pressable, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'

type Props = {
  size?: number
  active?: boolean
  speaking?: boolean
  onPress?: () => void
}

type BlobProps = {
  color: string
  blobSize: number
  duration: number
  delay: number
  speed: number
  fromX: number
  fromY: number
  toX: number
  toY: number
  opacity?: number
}

function Blob({
  color,
  blobSize,
  duration,
  delay,
  speed,
  fromX,
  fromY,
  toX,
  toY,
  opacity = 0.72,
}: BlobProps) {
  const id = useId().replace(/:/g, '').replace(/-/g, '')
  const progress = useSharedValue(0)

  useEffect(() => {
    const dur = (duration * 1000) / speed
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: dur, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: dur, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    )
  }, [speed])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: fromX + (toX - fromX) * progress.value },
      { translateY: fromY + (toY - fromY) * progress.value },
    ],
  }))

  return (
    <Animated.View style={[{ position: 'absolute', width: blobSize, height: blobSize }, style]}>
      <Svg width={blobSize} height={blobSize}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={String(opacity)} />
            <Stop offset="0.4" stopColor={color} stopOpacity={String((opacity * 0.4).toFixed(2))} />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={blobSize / 2} cy={blobSize / 2} r={blobSize / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  )
}

export function CatetinOrb({ size = 250, active = false, speaking = false, onPress }: Props) {
  const speed = speaking ? 5 : active ? 2.2 : 1
  const bs = size * 0.92
  const half = size / 2

  const scale = useSharedValue(1)

  useEffect(() => {
    if (speaking) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 340, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.96, { duration: 340, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      )
    } else {
      scale.value = withTiming(1, { duration: 200 })
    }
  }, [speaking])

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={[{ width: size, height: size }, scaleStyle]}>
      <Pressable
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={
          onPress ? (active ? 'Hentikan obrolan' : 'Mulai ngobrol dengan Catetin') : undefined
        }
        style={{ width: size, height: size }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: half,
            overflow: 'hidden',
            backgroundColor: 'transparent',
          }}
        >
          <Blob
            color="#6366f1"
            blobSize={bs}
            duration={9}
            delay={0}
            speed={speed}
            fromX={-bs * 0.1}
            fromY={-bs * 0.12}
            toX={bs * 0.08}
            toY={bs * 0.1}
          />
          <Blob
            color="#8b5cf6"
            blobSize={bs * 0.9}
            duration={11}
            delay={300}
            speed={speed}
            fromX={bs * 0.12}
            fromY={bs * 0.1}
            toX={-bs * 0.1}
            toY={-bs * 0.12}
          />
          <Blob
            color="#3b82f6"
            blobSize={bs * 0.82}
            duration={13}
            delay={600}
            speed={speed}
            fromX={-bs * 0.08}
            fromY={bs * 0.14}
            toX={bs * 0.12}
            toY={-bs * 0.1}
          />
          <Blob
            color="#a855f7"
            blobSize={bs * 0.72}
            duration={8}
            delay={150}
            speed={speed}
            fromX={bs * 0.1}
            fromY={-bs * 0.14}
            toX={-bs * 0.12}
            toY={bs * 0.1}
            opacity={0.55}
          />
        </View>
      </Pressable>
    </Animated.View>
  )
}
