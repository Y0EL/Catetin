import { Pressable, Text, View } from 'react-native'
import { useSubscription } from '~/hooks/use-subscription'

export function PaywallButton() {
  const { isPro, loading, openPaywall, openCustomerCenter } = useSubscription()

  if (loading) {
    return (
      <View className="rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
        <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Memuat status langganan
        </Text>
      </View>
    )
  }

  if (isPro) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kelola langganan Catetin Pro"
        onPress={() => {
          openCustomerCenter().catch(() => {})
        }}
        className="rounded-xl bg-zinc-900 px-4 py-3 active:opacity-90 dark:bg-white"
      >
        <Text className="text-center text-sm font-semibold text-white dark:text-zinc-900">
          Kelola Catetin Pro
        </Text>
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
      className="rounded-xl bg-primary-600 px-4 py-3 active:opacity-90"
    >
      <Text className="text-center text-sm font-semibold text-white">Coba Catetin Pro</Text>
    </Pressable>
  )
}
