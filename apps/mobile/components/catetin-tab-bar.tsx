import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useRouter } from 'expo-router'
import {
  House,
  Plus,
  Receipt,
  Settings as SettingsIcon,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAccentColor, useIsDark } from '~/lib/use-accent-color'

type TabKey = 'index' | 'transactions' | 'add' | 'companion' | 'settings'

const tabs: Record<TabKey, { icon: LucideIcon; label: string }> = {
  index: { icon: House, label: 'Home' },
  transactions: { icon: Receipt, label: 'Riwayat' },
  add: { icon: Plus, label: 'Catat' },
  companion: { icon: Sparkles, label: 'Curhat' },
  settings: { icon: SettingsIcon, label: 'Setting' },
}

const barShadow = {
  shadowColor: '#09090b',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  elevation: 12,
}

const fabShadow = {
  shadowColor: '#18181b',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.45,
  shadowRadius: 10,
  elevation: 8,
}

export function CatetinTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const accent = useAccentColor()
  const isDark = useIsDark()

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0 items-center"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <View
        className="flex-row items-center gap-1 rounded-full border border-zinc-100 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-900"
        style={barShadow}
      >
        {state.routes.map((route, index) => {
          const key = route.name as TabKey
          const config = tabs[key]
          if (!config) return null
          const isFocused = state.index === index

          if (key === 'add') {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel="Catat cepat"
                onPress={() => router.push('/add-modal')}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                  marginHorizontal: 4,
                })}
              >
                <View
                  className="h-12 w-12 items-center justify-center rounded-full bg-zinc-900 dark:bg-white"
                  style={fabShadow}
                >
                  <Plus size={24} color={isDark ? '#18181b' : '#ffffff'} strokeWidth={2.6} />
                </View>
              </Pressable>
            )
          }

          const Icon = config.icon
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={config.label}
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                })
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <View
                className={
                  isFocused
                    ? 'h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'
                    : 'h-12 w-12 items-center justify-center rounded-full'
                }
              >
                <Icon
                  size={22}
                  color={isFocused ? accent : '#a1a1aa'}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
