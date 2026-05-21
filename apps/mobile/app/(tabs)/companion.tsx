import { Sparkles } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CatetinOrb } from '~/components/catetin-orb'
import { ScreenFade } from '~/components/screen-fade'
import { useAccentColor } from '~/lib/use-accent-color'

export default function CompanionTab() {
  const [active, setActive] = useState(false)
  const accent = useAccentColor()

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <View className="flex-1 px-4 pt-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">
                Temen ngobrol
              </Text>
              <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Curhat
              </Text>
            </View>
            <View className="flex-row items-center gap-1 rounded-full bg-primary-50 px-3 py-1.5 dark:bg-primary-950">
              <Sparkles size={12} color={accent} />
              <Text className="font-sans text-xs font-semibold text-primary-700 dark:text-primary-300">
                Pro
              </Text>
            </View>
          </View>

          <View className="flex-1 items-center justify-center">
            <CatetinOrb size={250} active={active} onPress={() => setActive((v) => !v)} />
            <Text className="mt-6 font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {active ? 'Lagi dengerin' : 'Tap orb buat mulai'}
            </Text>
            <Text className="mt-2 max-w-[280px] text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
              {active
                ? 'Ngomong aja apa adanya, gue gak nge-judge.'
                : 'Curhat, minta saran budget, atau cerita aja soal duit.'}
            </Text>
          </View>

          <View className="mb-28 rounded-card bg-white p-5 dark:bg-zinc-800">
            <View className="flex-row items-center justify-between">
              <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Kuota hari ini
              </Text>
              <Text className="font-sans text-xs font-semibold text-primary-600 dark:text-primary-200">
                Free
              </Text>
            </View>
            <View className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <View className="h-full w-full rounded-full bg-primary-600" />
            </View>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="font-sans text-sm text-zinc-700 dark:text-zinc-200">
                <Text className="font-semibold text-zinc-900 dark:text-zinc-100">10 menit</Text>{' '}
                tersisa
              </Text>
              <Pressable className="rounded-full bg-primary-600 px-4 py-2 active:opacity-90">
                <Text className="font-sans text-sm font-semibold text-white">Unlimited</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScreenFade>
    </SafeAreaView>
  )
}
