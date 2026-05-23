import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ArrowLeft, Send, Users } from 'lucide-react-native'
import { useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Money } from '~/components/money'
import { ScreenFade } from '~/components/screen-fade'
import { apiFetch, apiErrorMessage, apiStream } from '~/lib/api'
import { useT } from '~/lib/lang-context'
import { useAccentColor } from '~/lib/use-accent-color'

type Msg = { id: string; role: 'user' | 'model'; content: string }
type SplitShare = { nama: string; jumlah: number; aku: boolean }
type SplitResult = { total: number; hasil: SplitShare[] }

const STREAM_ID = '__streaming__'

export default function SplitBillScreen() {
  const router = useRouter()
  const accent = useAccentColor()
  const t = useT()
  const scrollRef = useRef<ScrollView>(null)

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null)

  const history = messages
    .filter((m) => m.id !== STREAM_ID)
    .map((m) => ({ role: m.role, content: m.content }))

  const record = useMutation({
    mutationFn: (vars: { amount: number; description: string }) =>
      apiFetch('/v1/split-bill/record', {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
    onSuccess: () => {
      setSplitResult(null)
      Alert.alert(t('split_saved_title'), t('split_saved_body'))
    },
    onError: (err) => Alert.alert(t('common_error'), apiErrorMessage(err)),
  })

  async function onSend() {
    const msg = input.trim()
    if (!msg || streaming) return
    setInput('')
    setStreaming(true)

    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: msg }
    const modelMsg: Msg = { id: STREAM_ID, role: 'model', content: '' }
    setMessages((prev) => [...prev, userMsg, modelMsg])
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)

    try {
      await apiStream('/v1/split-bill/chat', { message: msg, history }, (raw) => {
        try {
          const data = JSON.parse(raw) as {
            chunk?: string
            splitResult?: SplitResult
            done?: boolean
            error?: string
          }
          if (data.chunk) {
            setMessages((prev) =>
              prev.map((m) => (m.id === STREAM_ID ? { ...m, content: m.content + data.chunk } : m)),
            )
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 20)
          }
          if (data.splitResult) {
            setSplitResult(data.splitResult)
          }
        } catch {
          // malformed chunk
        }
      })
    } catch (err) {
      Alert.alert(t('common_error'), apiErrorMessage(err))
      setMessages((prev) => prev.filter((m) => m.id !== STREAM_ID))
    } finally {
      setStreaming(false)
      setMessages((prev) =>
        prev.map((m) => (m.id === STREAM_ID ? { ...m, id: `m-${Date.now()}` } : m)),
      )
    }
  }

  const myShare = splitResult?.hasil.find((h) => h.aku)

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <View className="flex-row items-center gap-2 px-4 pb-2 pt-3">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
            accessibilityLabel={t('common_back')}
          >
            <ArrowLeft size={18} color={accent} />
          </Pressable>
          <Text className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('split_title')}
          </Text>
        </View>

        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScrollView
            ref={scrollRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 8, paddingTop: 4 }}
          >
            {messages.length === 0 ? (
              <View className="items-center justify-center py-20">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950">
                  <Users size={28} color={accent} />
                </View>
                <Text className="mt-4 text-center font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {t('split_empty_title')}
                </Text>
                <Text className="mt-1 max-w-[260px] text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
                  {t('split_empty_body')}
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
                      m.role === 'user' ? 'bg-primary-600' : 'bg-white shadow-sm dark:bg-zinc-800'
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

          <View className="border-t border-zinc-100 dark:border-zinc-800">
            {splitResult ? (
              <View className="mx-4 mt-3 rounded-2xl bg-white px-4 py-4 dark:bg-zinc-800">
                <Text className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {t('split_result_title')}
                </Text>
                <View className="mt-2 gap-1.5">
                  {splitResult.hasil.map((h, i) => (
                    <View key={i} className="flex-row items-center justify-between">
                      <Text
                        className={`font-sans text-sm ${
                          h.aku
                            ? 'font-bold text-primary-600 dark:text-primary-400'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {h.nama}
                        {h.aku ? t('split_you') : ''}
                      </Text>
                      <Money value={h.jumlah} size="sm" tone={h.aku ? 'expense' : 'default'} />
                    </View>
                  ))}
                </View>
                {myShare ? (
                  <Pressable
                    onPress={() =>
                      record.mutate({ amount: myShare.jumlah, description: 'Split tagihan' })
                    }
                    disabled={record.isPending}
                    className="mt-4 items-center rounded-full bg-primary-600 py-2.5 active:opacity-80 disabled:opacity-40"
                    accessibilityLabel={t('split_log_share')}
                  >
                    <Text className="font-sans text-sm font-semibold text-white">
                      {record.isPending ? t('common_saving') : t('split_log_share')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <View className="flex-row items-end gap-2 px-4 py-3">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={t('split_placeholder')}
                placeholderTextColor="#a1a1aa"
                className="flex-1 rounded-2xl bg-white px-4 py-3 font-sans text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                multiline
                maxLength={1000}
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={onSend}
              />
              <Pressable
                onPress={onSend}
                disabled={!input.trim() || streaming}
                className="h-11 w-11 items-center justify-center rounded-full bg-primary-600 active:opacity-80 disabled:opacity-40"
                accessibilityLabel={t('split_send')}
              >
                <Send size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScreenFade>
    </SafeAreaView>
  )
}
