import LottieView from 'lottie-react-native'
import { View } from 'react-native'
import loadingSource from '../assets/lottie/loading.json'
import { tintLottie } from './lottie-tint'

const blackSource = tintLottie(loadingSource, [0, 0, 0])

type Props = { size?: number }

export function LoadingLottie({ size = 120 }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <LottieView
        source={blackSource as object}
        autoPlay
        loop
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </View>
  )
}
