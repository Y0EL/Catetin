import LottieView from 'lottie-react-native'
import { View } from 'react-native'
import loadingSource from '../assets/lottie/loading.json'

type Props = { size?: number }

export function LoadingLottie({ size = 120 }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <LottieView
        source={loadingSource}
        autoPlay
        loop
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </View>
  )
}
