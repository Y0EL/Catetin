import { useColorScheme as useNativeWindScheme } from 'nativewind'
import { useColorScheme as useRNScheme } from 'react-native'

export function useIsDark(): boolean {
  const { colorScheme } = useNativeWindScheme()
  const osScheme = useRNScheme()
  if (colorScheme === 'dark') return true
  if (colorScheme === 'light') return false
  return osScheme === 'dark'
}

export function useAccentColor(): string {
  return useIsDark() ? '#fafafa' : '#18181b'
}
