import LottieView from 'lottie-react-native'
import { Pressable } from 'react-native'
import orbSource from '../assets/lottie/orb.json'

type Props = {
  size?: number
  active?: boolean
  onPress?: () => void
}

export function CatetinOrb({ size = 250, active = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? 'Hentikan obrolan' : 'Mulai ngobrol dengan Catetin'}
      onPress={onPress}
      style={{ width: size, height: size }}
    >
      <LottieView
        source={orbSource}
        autoPlay
        loop
        speed={active ? 1.6 : 0.9}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </Pressable>
  )
}
