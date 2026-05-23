import { Paperclip } from 'lucide-react-native'
import { View } from 'react-native'
import { useAccentColor } from '~/lib/use-accent-color'

export function NoteCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const accent = useAccentColor()

  return (
    <View className="relative">
      <View
        pointerEvents="none"
        className="absolute -top-3 left-6 z-10"
        style={{ transform: [{ rotate: '-16deg' }], elevation: 10 }}
      >
        <Paperclip size={24} color={accent} strokeWidth={2.25} />
      </View>
      <View className={`rounded-card bg-white dark:bg-zinc-800 ${className}`}>{children}</View>
    </View>
  )
}
