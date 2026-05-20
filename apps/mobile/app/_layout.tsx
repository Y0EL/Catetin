import '../global.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ActivityIndicator, Platform, useColorScheme, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth } from '~/hooks/use-auth'
import { getFirebaseAuth } from '~/lib/firebase'
import { configurePurchases } from '~/lib/revenuecat'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1 },
  },
})

const REVENUECAT_KEY = process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY ?? ''

function useWebDarkClass(scheme: 'light' | 'dark' | null | undefined) {
  useEffect(() => {
    if (Platform.OS !== 'web') return
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (scheme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [scheme])
}

function AuthGate() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
      return
    }
    if (user && inAuthGroup) {
      router.replace('/')
    }
  }, [user, loading, segments, router])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
}

export default function RootLayout() {
  const scheme = useColorScheme()
  useWebDarkClass(scheme)

  useEffect(() => {
    getFirebaseAuth()
    configurePurchases(REVENUECAT_KEY)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthGate />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  )
}
