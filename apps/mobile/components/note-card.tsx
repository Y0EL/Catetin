import { Paperclip } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { View } from 'react-native'

export function NoteCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const { colorScheme } = useColorScheme()
  const clipColor = colorScheme === 'dark' ? '#ffffff' : '#18181b'

  return (
    <View className="relative">
      <View
        pointerEvents="none"
        className="absolute -top-3 left-6 z-10"
        style={{ transform: [{ rotate: '-16deg' }] }}
      >
        <Paperclip size={24} color={clipColor} strokeWidth={2.25} />
      </View>
      <View className={`rounded-card bg-white dark:bg-zinc-800 ${className}`}>{children}</View>
    </View>
  )
}
