import { Paperclip } from 'lucide-react-native'
import { View } from 'react-native'

export function NoteCard({
  children,
  className = '',
  clipColor = '#4f46e5',
}: {
  children: React.ReactNode
  className?: string
  clipColor?: string
}) {
  return (
    <View className="relative">
      <View
        pointerEvents="none"
        className="absolute -top-3 left-6 z-10"
        style={{ transform: [{ rotate: '-16deg' }] }}
      >
        <Paperclip size={24} color={clipColor} strokeWidth={2.25} />
      </View>
      <View className={`rounded-card bg-white dark:bg-zinc-900 ${className}`}>{children}</View>
    </View>
  )
}
