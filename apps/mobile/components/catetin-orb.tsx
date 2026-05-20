import LottieView from 'lottie-react-native'
import { Pressable, View } from 'react-native'
import orbSource from '../assets/lottie/catetin-orb.json'

type Props = {
  size?: number
  active?: boolean
  onPress?: () => void
}

export function CatetinOrb({ size = 250, active = false, onPress }: Props) {
  const frame = size * 1.3

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? 'Hentikan obrolan' : 'Mulai ngobrol dengan Catetin'}
      onPress={onPress}
      style={{ width: frame, height: frame, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size * 0.92,
          height: size * 0.92,
          borderRadius: 9999,
          backgroundColor: '#6366f1',
          opacity: active ? 0.4 : 0.22,
          shadowColor: '#6366f1',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: active ? 60 : 40,
          elevation: 0,
        }}
      />
      <LottieView
        source={orbSource}
        autoPlay
        loop
        speed={active ? 1.5 : 0.85}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </Pressable>
  )
}
