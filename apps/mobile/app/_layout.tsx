import '~/lib/reanimated-init'
import '../global.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { colorScheme, useColorScheme } from 'nativewind'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth } from '~/hooks/use-auth'
import { useBootstrapSession } from '~/hooks/use-bootstrap-session'
import { useRegisterPush } from '~/hooks/use-register-push'
import { getFirebaseAuth } from '~/lib/firebase'
import { configurePurchases } from '~/lib/revenuecat'
import { EditTransactionProvider } from '~/lib/edit-store'
import { ThemeProvider } from '~/lib/theme'

colorScheme.set('system')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1 },
  },
})

const REVENUECAT_KEY = process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY ?? ''

function AuthGate() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useBootstrapSession(Boolean(user))
  useRegisterPush()

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
      return
    }
    if (user && inAuthGroup) {
      router.replace('/(tabs)/index')
    }
  }, [user, loading, segments, router])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="large" color="#18181b" />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-modal"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="budgets" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="analytics" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="paywall"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  )
}

export default function RootLayout() {
  const { colorScheme: scheme } = useColorScheme()

  useEffect(() => {
    getFirebaseAuth()
    configurePurchases(REVENUECAT_KEY)
  }, [])

  return (
    <ThemeProvider>
      <EditTransactionProvider>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <AuthGate />
              <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </EditTransactionProvider>
    </ThemeProvider>
  )
}
