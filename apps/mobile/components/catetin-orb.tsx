import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View, type LayoutChangeEvent } from 'react-native'
import orbSource from '../assets/lottie/orb.json'

type Props = {
  size?: number
  active?: boolean
  onPress?: () => void
}

export function CatetinOrb({ size = 250, active = false, onPress }: Props) {
  const [ready, setReady] = useState(false)
  const raf = useRef<number | null>(null)

  function onLayout(e: LayoutChangeEvent) {
    if (e.nativeEvent.layout.width > 0 && !ready) {
      raf.current = requestAnimationFrame(() => {
        raf.current = requestAnimationFrame(() => setReady(true))
      })
    }
  }

  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    },
    [],
  )

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? 'Hentikan obrolan' : 'Mulai ngobrol dengan Catetin'}
      onPress={onPress}
      onLayout={onLayout}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {ready ? (
        <LottieView
          source={orbSource}
          autoPlay
          loop
          speed={active ? 1.6 : 0.9}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
      ) : (
        <View style={{ width: size, height: size }} />
      )}
    </Pressable>
  )
}
