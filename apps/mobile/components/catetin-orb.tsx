import { useEffect } from 'react'
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

type Props = {
  size?: number
  active?: boolean
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
  opacity = 0.38,
}: BlobProps) {
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
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: blobSize,
          height: blobSize,
          borderRadius: blobSize / 2,
          backgroundColor: color,
          opacity,
        },
        style,
      ]}
    />
  )
}

export function CatetinOrb({ size = 250, active = false, onPress }: Props) {
  const speed = active ? 2.2 : 1
  const bs = size * 0.68
  const half = size / 2

  return (
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
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <Blob
          color="#6366f1"
          blobSize={bs}
          duration={9}
          delay={0}
          speed={speed}
          fromX={-bs * 0.18}
          fromY={-bs * 0.22}
          toX={bs * 0.12}
          toY={bs * 0.18}
        />
        <Blob
          color="#8b5cf6"
          blobSize={bs * 0.88}
          duration={11}
          delay={300}
          speed={speed}
          fromX={bs * 0.22}
          fromY={bs * 0.18}
          toX={-bs * 0.18}
          toY={-bs * 0.22}
        />
        <Blob
          color="#3b82f6"
          blobSize={bs * 0.74}
          duration={13}
          delay={600}
          speed={speed}
          fromX={-bs * 0.12}
          fromY={bs * 0.28}
          toX={bs * 0.24}
          toY={-bs * 0.18}
        />
        <Blob
          color="#ec4899"
          blobSize={bs * 0.58}
          duration={8}
          delay={150}
          speed={speed}
          fromX={bs * 0.14}
          fromY={-bs * 0.28}
          toX={-bs * 0.22}
          toY={bs * 0.22}
        />
      </View>
    </Pressable>
  )
}
