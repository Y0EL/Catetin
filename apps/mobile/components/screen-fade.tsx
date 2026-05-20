import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

export function ScreenFade({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(10)

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0
      translateY.value = 10
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) })
      translateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
    }, [opacity, translateY]),
  )

  const style = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return <Animated.View style={style}>{children}</Animated.View>
}
