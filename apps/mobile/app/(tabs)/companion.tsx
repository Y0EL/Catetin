import { Sparkles } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CatetinOrb } from '~/components/catetin-orb'
import { ScreenFade } from '~/components/screen-fade'
import { useCompanionQuota, useEndCompanion, useStartCompanion } from '~/hooks/use-companion'
import { apiErrorMessage } from '~/lib/api'
import { useAccentColor } from '~/lib/use-accent-color'

function formatMinutes(totalSec: number): string {
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (min <= 0) return `${sec}d`
  if (sec === 0) return `${min}m`
  return `${min}m ${sec}d`
}

export default function CompanionTab() {
  const accent = useAccentColor()
  const quota = useCompanionQuota()
  const start = useStartCompanion()
  const end = useEndCompanion()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const active = sessionId !== null

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      return
    }
    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [active])

  async function onToggle() {
    if (active && sessionId) {
      const id = sessionId
      setSessionId(null)
      setElapsedSec(0)
      end.mutate(id)
      return
    }
    start.mutate(undefined, {
      onSuccess: (res) => {
        setSessionId(res.sessionId)
        setElapsedSec(0)
      },
      onError: (err) => Alert.alert('Gak bisa mulai', apiErrorMessage(err)),
    })
  }

  const data = quota.data
  const isPro = data?.isPro === true
  const limit = data?.dailyLimitSec ?? 600
  const used = (data?.usedTodaySec ?? 0) + elapsedSec
  const remaining = isPro ? null : Math.max(0, limit - used)
  const pct = isPro ? 100 : limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

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
                {isPro ? 'Pro' : 'Free'}
              </Text>
            </View>
          </View>

          <View className="flex-1 items-center justify-center">
            <CatetinOrb size={250} active={active} onPress={onToggle} />
            <Text className="mt-6 font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {active ? `Lagi dengerin · ${formatMinutes(elapsedSec)}` : 'Tap orb buat mulai'}
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
                {isPro ? 'Unlimited' : 'Free'}
              </Text>
            </View>
            <View className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
              <View className="h-full rounded-full bg-primary-600" style={{ width: `${pct}%` }} />
            </View>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="font-sans text-sm text-zinc-700 dark:text-zinc-200">
                {isPro ? (
                  <Text className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Catetin Pro aktif
                  </Text>
                ) : (
                  <>
                    <Text className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatMinutes(remaining ?? 0)}
                    </Text>{' '}
                    tersisa
                  </>
                )}
              </Text>
              {!isPro ? (
                <Pressable className="rounded-full bg-primary-600 px-4 py-2 active:opacity-90">
                  <Text className="font-sans text-sm font-semibold text-white">Unlimited</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </ScreenFade>
    </SafeAreaView>
  )
}
