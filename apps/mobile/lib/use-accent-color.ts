import { useColorScheme } from 'nativewind'

// Warna ikon aksen yang ngikut tema: gelap di light mode, terang di dark mode.
export function useAccentColor(): string {
  const { colorScheme } = useColorScheme()
  return colorScheme === 'dark' ? '#fafafa' : '#18181b'
}

export function useIsDark(): boolean {
  const { colorScheme } = useColorScheme()
  return colorScheme === 'dark'
}
