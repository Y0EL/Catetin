import { MessageCircle, Mic, Send, Trash2, X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { CatetinOrb } from '~/components/catetin-orb'
import { ScreenFade } from '~/components/screen-fade'
import {
  useClearHistory,
  useCompanionHistory,
  useCompanionTurn,
  useEndCompanion,
  useStartCompanion,
} from '~/hooks/use-companion'
import { apiErrorMessage, apiStream } from '~/lib/api'
import { useCompanionRecorder } from '~/lib/companion-audio'
import { useCompanionTts } from '~/lib/companion-tts'
import { useAccentColor } from '~/lib/use-accent-color'

type Tab = 'voice' | 'chat'
type VoicePhase = 'idle' | 'recording' | 'thinking'

type Msg = {
  id: string
  role: 'user' | 'model'
  content: string
  source: 'voice' | 'chat'
}

const STREAM_ID = '__streaming__'

function formatMinutes(totalSec: number): string {
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (min <= 0) return `${sec}d`
  if (sec === 0) return `${min}m`
  return `${min}m ${sec}d`
}

export default function CompanionTab() {
  const accent = useAccentColor()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>('voice')

  // voice
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle')
  const [elapsedSec, setElapsedSec] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const rec = useCompanionRecorder()
  const tts = useCompanionTts()

  // chat
  const [messages, setMessages] = useState<Msg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const start = useStartCompanion()
  const end = useEndCompanion()
  const turn = useCompanionTurn()
  const history = useCompanionHistory()
  const clearHistory = useClearHistory()

  useEffect(() => {
    if (history.data) {
      setMessages(
        history.data.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          source: m.source,
        })),
      )
    }
  }, [history.data])

  useEffect(() => {
    if (sessionId) {
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [sessionId])

  useEffect(() => {
    return () => {
      rec.cancel()
      tts.stop()
    }
  }, [])

  useEffect(() => {
    if (tab === 'chat') {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
    }
  }, [messages, tab])

  function fail(msg: string) {
    Alert.alert('Gak bisa', msg)
  }

  async function startSession(): Promise<string | null> {
    return new Promise((resolve) => {
      start.mutate(undefined, {
        onSuccess: (res) => {
          setSessionId(res.sessionId)
          setElapsedSec(0)
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
      await rec.start()
      setVoicePhase('recording')
    } catch (err) {
      setSessionId(null)
      end.mutate(id)
      fail(err instanceof Error ? err.message : 'Gagal mulai rekam.')
    }
  }

  async function endRecordingAndSend(id: string) {
    if (voicePhase !== 'recording') return
    setVoicePhase('thinking')
    try {
      const audio = await rec.stop()
      const res = await turn.mutateAsync({
        sessionId: id,
        audio: audio.base64,
        mimeType: audio.mimeType,
      })
      if (res.audio) {
        tts.play(res.audio)
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `v-u-${Date.now()}`,
          role: 'user',
          content: res.transcript || '[Pesan suara]',
          source: 'voice',
        },
        { id: `v-m-${Date.now()}`, role: 'model', content: res.text, source: 'voice' },
      ])
    } catch (err) {
      fail(apiErrorMessage(err))
    } finally {
      setVoicePhase('idle')
    }
  }

  async function onVoiceToggle() {
    if (voicePhase === 'thinking' || tts.playing) return
    if (voicePhase === 'recording' && sessionId) {
      await endRecordingAndSend(sessionId)
      return
    }
    const id = sessionId ?? (await startSession())
    if (!id) return
    await beginRecording(id)
  }

  function onVoiceClose() {
    rec.cancel()
    tts.stop()
    const id = sessionId
    setSessionId(null)
    setVoicePhase('idle')
    setElapsedSec(0)
    if (id) end.mutate(id)
  }

  async function onSendChat() {
    const msg = chatInput.trim()
    if (!msg || streaming) return
    setChatInput('')
    setStreaming(true)

    const userMsg: Msg = { id: `c-u-${Date.now()}`, role: 'user', content: msg, source: 'chat' }
    const modelMsg: Msg = { id: STREAM_ID, role: 'model', content: '', source: 'chat' }
    setMessages((prev) => [...prev, userMsg, modelMsg])

    try {
      await apiStream('/v1/companion/chat', { message: msg }, (raw) => {
        try {
          const data = JSON.parse(raw) as { chunk?: string; done?: boolean; error?: string }
          if (data.chunk) {
            setMessages((prev) =>
              prev.map((m) => (m.id === STREAM_ID ? { ...m, content: m.content + data.chunk } : m)),
            )
          }
        } catch {
          // malformed chunk
        }
      })
    } catch (err) {
      fail(apiErrorMessage(err))
      setMessages((prev) => prev.filter((m) => m.id !== STREAM_ID))
    } finally {
      setStreaming(false)
      setMessages((prev) =>
        prev.map((m) => (m.id === STREAM_ID ? { ...m, id: `c-m-${Date.now()}` } : m)),
      )
      history.refetch()
    }
  }

  function onClearHistory() {
    Alert.alert('Hapus riwayat?', 'Semua pesan bakal dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          clearHistory.mutate(undefined, {
            onSuccess: () => setMessages([]),
            onError: (err) => fail(apiErrorMessage(err)),
          })
        },
      },
    ])
  }

  const active = sessionId !== null
  const voiceLabel =
    voicePhase === 'recording'
      ? `Ngedengerin · ${formatMinutes(elapsedSec)}`
      : voicePhase === 'thinking'
        ? 'Lagi mikir...'
        : tts.playing
          ? 'Jawaban...'
          : active
            ? `Tap buat lanjut · ${formatMinutes(elapsedSec)}`
            : 'Tap buat mulai'

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <View className="flex-1" style={{ paddingBottom: Math.max(insets.bottom, 12) + 76 }}>
          <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
            <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Curhat
            </Text>
            <View className="flex-row items-center gap-2">
              {tab === 'chat' ? (
                <Pressable
                  onPress={onClearHistory}
                  className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
                  accessibilityLabel="Hapus riwayat"
                >
                  <Trash2 size={16} color={accent} />
                </Pressable>
              ) : active ? (
                <Pressable
                  onPress={onVoiceClose}
                  className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
                  accessibilityLabel="Tutup sesi"
                >
                  <X size={16} color={accent} />
                </Pressable>
              ) : null}
              <View className="flex-row overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <Pressable
                  onPress={() => setTab('voice')}
                  className={`items-center justify-center px-4 py-2 ${tab === 'voice' ? 'bg-primary-600' : ''}`}
                  accessibilityLabel="Mode suara"
                >
                  <Mic size={14} color={tab === 'voice' ? '#fff' : accent} />
                </Pressable>
                <Pressable
                  onPress={() => setTab('chat')}
                  className={`items-center justify-center px-4 py-2 ${tab === 'chat' ? 'bg-primary-600' : ''}`}
                  accessibilityLabel="Mode chat"
                >
                  <MessageCircle size={14} color={tab === 'chat' ? '#fff' : accent} />
                </Pressable>
              </View>
            </View>
          </View>

          {tab === 'voice' ? (
            <View className="flex-1 items-center justify-center px-4">
              <CatetinOrb
                size={250}
                active={voicePhase === 'recording'}
                speaking={tts.playing}
                onPress={onVoiceToggle}
              />
              <Text className="mt-6 text-center font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {voiceLabel}
              </Text>
            </View>
          ) : (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="flex-1"
            >
              <ScrollView
                ref={scrollRef}
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 8, paddingTop: 4 }}
              >
                {messages.length === 0 ? (
                  <View className="items-center justify-center py-20">
                    <Text className="text-center font-sans text-sm text-zinc-400 dark:text-zinc-500">
                      Belum ada pesan. Yuk mulai ngobrol!
                    </Text>
                  </View>
                ) : (
                  messages.map((m, i) => (
                    <View
                      key={m.id || String(i)}
                      className={`mb-2 max-w-[80%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}
                    >
                      <View
                        className={`rounded-2xl px-4 py-3 ${
                          m.role === 'user'
                            ? 'bg-primary-600'
                            : 'bg-white shadow-sm dark:bg-zinc-800'
                        }`}
                      >
                        <Text
                          className={`font-sans text-sm leading-5 ${
                            m.role === 'user' ? 'text-white' : 'text-zinc-800 dark:text-zinc-100'
                          }`}
                        >
                          {m.content || '...'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
              <View className="flex-row items-end gap-2 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <TextInput
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Ketik pesan..."
                  placeholderTextColor="#a1a1aa"
                  className="flex-1 rounded-2xl bg-white px-4 py-3 font-sans text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  multiline
                  maxLength={2000}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  onSubmitEditing={onSendChat}
                />
                <Pressable
                  onPress={onSendChat}
                  disabled={!chatInput.trim() || streaming}
                  className="h-11 w-11 items-center justify-center rounded-full bg-primary-600 active:opacity-80 disabled:opacity-40"
                  accessibilityLabel="Kirim"
                >
                  <Send size={18} color="#fff" />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      </ScreenFade>
    </SafeAreaView>
  )
}
