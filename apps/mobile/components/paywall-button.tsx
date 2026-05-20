import { Pressable, Text, View } from 'react-native'
import { useSubscription } from '~/hooks/use-subscription'

export function PaywallButton() {
  const { isPro, loading, openPaywall, openCustomerCenter } = useSubscription()

  if (loading) {
    return (
      <View className="self-start rounded-full bg-white/15 px-5 py-2.5">
        <Text className="font-sans text-sm text-white/70">Memuat</Text>
      </View>
    )
  }

  if (isPro) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kelola Catetin Pro"
        onPress={() => {
          openCustomerCenter().catch(() => {})
        }}
        className="self-start rounded-full bg-white px-5 py-2.5 active:opacity-90"
      >
        <Text className="font-sans text-sm font-semibold text-primary-700">Kelola Pro</Text>
      </Pressable>
    )
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Coba Catetin Pro"
      onPress={() => {
        openPaywall().catch(() => {})
      }}
      className="self-start rounded-full bg-white px-5 py-2.5 active:opacity-90"
    >
      <Text className="font-sans text-sm font-semibold text-primary-700">Coba 7 hari gratis</Text>
    </Pressable>
  )
}
