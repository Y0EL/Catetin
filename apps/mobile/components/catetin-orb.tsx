import LottieView from 'lottie-react-native'
import { useState } from 'react'
import { Pressable, View, type LayoutChangeEvent } from 'react-native'
import orbSource from '../assets/lottie/catetin-orb.json'

type Props = {
  size?: number
  active?: boolean
  onPress?: () => void
}

export function CatetinOrb({ size = 250, active = false, onPress }: Props) {
  const frame = size * 1.3
  const [ready, setReady] = useState(false)

  function onLayout(e: LayoutChangeEvent) {
    if (e.nativeEvent.layout.width > 0 && !ready) setReady(true)
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? 'Hentikan obrolan' : 'Mulai ngobrol dengan Catetin'}
      onPress={onPress}
      onLayout={onLayout}
      style={{ width: frame, height: frame, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size * 0.92,
          height: size * 0.92,
          borderRadius: 9999,
          backgroundColor: '#52525b',
          opacity: active ? 0.4 : 0.22,
          shadowColor: '#52525b',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: active ? 60 : 40,
          elevation: 0,
        }}
      />
      {ready ? (
        <LottieView
          source={orbSource}
          autoPlay
          loop
          speed={active ? 1.5 : 0.85}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
      ) : (
        <View style={{ width: size, height: size }} />
      )}
    </Pressable>
  )
}
