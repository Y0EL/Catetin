import { Sparkles, X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Alert, Platform, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CatetinOrb } from '~/components/catetin-orb'
import { ScreenFade } from '~/components/screen-fade'
import {
  useCompanionQuota,
  useCompanionTurn,
  useEndCompanion,
  useStartCompanion,
} from '~/hooks/use-companion'
import { apiErrorMessage } from '~/lib/api'
import { createCompanionRecorder, type CompanionRecorder } from '~/lib/companion-audio'
import { cancelCompanionSpeech, speakCompanionReply } from '~/lib/companion-speech'
import { useAccentColor } from '~/lib/use-accent-color'

type Bubble = { role: 'user' | 'catetin'; text: string }
type Mode = 'idle' | 'recording' | 'thinking'

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
  const turn = useCompanionTurn()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [mode, setMode] = useState<Mode>('idle')
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const recorderRef = useRef<CompanionRecorder | null>(null)
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

  useEffect(() => {
    return () => {
      recorderRef.current?.cancel()
    }
  }, [])

  function fail(message: string) {
    Alert.alert('Gak bisa', message)
  }

  async function startSession(): Promise<string | null> {
    return new Promise((resolve) => {
      start.mutate(undefined, {
        onSuccess: (res) => {
          setSessionId(res.sessionId)
          setElapsedSec(0)
          setBubbles([])
          resolve(res.sessionId)
        },
        onError: (err) => {
          fail(apiErrorMessage(err))
          resolve(null)
        },
      })
    })
  }

  async function beginRecording(id: string) {
    try {
      const rec = createCompanionRecorder()
      await rec.start()
      recorderRef.current = rec
      setMode('recording')
    } catch (err) {
      setSessionId(null)
      end.mutate(id)
      fail(err instanceof Error ? err.message : 'Gagal mulai rekam.')
    }
  }

  async function endRecordingAndSend(id: string) {
    const rec = recorderRef.current
    if (!rec) return
    setMode('thinking')
    try {
      const audio = await rec.stop()
      recorderRef.current = null
      const res = await turn.mutateAsync({
        sessionId: id,
        audio: audio.base64,
        mimeType: audio.mimeType,
      })
      setBubbles((prev) =>
        (
          [...prev, { role: 'user', text: '...' }, { role: 'catetin', text: res.text }] as Bubble[]
        ).slice(-6),
      )
      speakCompanionReply(res.text)
    } catch (err) {
      fail(apiErrorMessage(err))
    } finally {
      setMode('idle')
    }
  }

  async function onToggle() {
    if (Platform.OS !== 'web') {
      fail('Voice masih web-only buat sekarang, native nyusul ya.')
      return
    }
    if (mode === 'thinking') return
    if (mode === 'recording' && sessionId) {
      await endRecordingAndSend(sessionId)
      return
    }
    const id = sessionId ?? (await startSession())
    if (!id) return
    await beginRecording(id)
  }

  function onClose() {
    if (!sessionId) return
    recorderRef.current?.cancel()
    recorderRef.current = null
    cancelCompanionSpeech()
    const id = sessionId
    setSessionId(null)
    setMode('idle')
    setBubbles([])
    setElapsedSec(0)
    end.mutate(id)
  }

  const data = quota.data
  const isPro = data?.isPro === true
  const limit = data?.dailyLimitSec ?? 600
  const used = (data?.usedTodaySec ?? 0) + elapsedSec
  const remaining = isPro ? null : Math.max(0, limit - used)
  const pct = isPro ? 100 : limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

  const label =
    mode === 'recording'
      ? `Ngedengerin · ${formatMinutes(elapsedSec)}`
      : mode === 'thinking'
        ? 'Lagi mikir...'
        : active
          ? `Tap orb buat lanjut · ${formatMinutes(elapsedSec)}`
          : 'Tap orb buat mulai'

  const hint =
    mode === 'recording'
      ? 'Tap lagi kalo udah selesai ngomong.'
      : mode === 'thinking'
        ? 'Tunggu sebentar ya, gue lagi nyusun jawabannya.'
        : active
          ? 'Lanjut ngobrol atau tutup sesi pas udah cukup.'
          : 'Curhat, minta saran budget, atau cerita aja soal duit.'

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
            <View className="flex-row items-center gap-2">
              {active ? (
                <Pressable
                  onPress={onClose}
                  className="h-9 w-9 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800"
                  accessibilityLabel="Tutup sesi"
                >
                  <X size={16} color={accent} />
                </Pressable>
              ) : null}
              <View className="flex-row items-center gap-1 rounded-full bg-primary-50 px-3 py-1.5 dark:bg-primary-950">
                <Sparkles size={12} color={accent} />
                <Text className="font-sans text-xs font-semibold text-primary-700 dark:text-primary-300">
                  {isPro ? 'Pro' : 'Free'}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-1 items-center justify-center">
            <CatetinOrb size={250} active={mode === 'recording'} onPress={onToggle} />
            <Text className="mt-6 text-center font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {label}
            </Text>
            <Text className="mt-2 max-w-[280px] text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
              {hint}
            </Text>
            {bubbles.length > 0 ? (
              <View className="mt-6 w-full max-w-[360px] gap-2">
                {bubbles
                  .filter((b) => b.role === 'catetin')
                  .slice(-2)
                  .map((b, i) => (
                    <View
                      key={`reply-${i}`}
                      className="rounded-card bg-white px-4 py-3 dark:bg-zinc-800"
                    >
                      <Text className="font-sans text-sm leading-5 text-zinc-800 dark:text-zinc-100">
                        {b.text}
                      </Text>
                    </View>
                  ))}
              </View>
            ) : null}
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
