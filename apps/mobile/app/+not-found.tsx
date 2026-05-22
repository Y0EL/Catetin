import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'

export default function NotFound() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (user) {
      router.replace('/(tabs)/index')
    } else {
      router.replace('/(auth)/login')
    }
  }, [user, loading, router])

  return null
}
