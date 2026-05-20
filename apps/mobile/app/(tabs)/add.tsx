import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View } from 'react-native'

export default function AddTabPlaceholder() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/add-modal')
  }, [router])
  return <View className="flex-1 bg-zinc-50 dark:bg-zinc-950" />
}
