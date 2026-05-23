import AsyncStorage from '@react-native-async-storage/async-storage'
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio'
import { useRouter } from 'expo-router'
import { BarChart2, Camera, Mic, Sparkles, Users } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '~/lib/lang-context'
import { useAccentColor } from '~/lib/use-accent-color'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioIdStep1 = require('../assets/audio/onboarding-id-1.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioIdStep2 = require('../assets/audio/onboarding-id-2.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioIdStep3 = require('../assets/audio/onboarding-id-3.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioIdStep4 = require('../assets/audio/onboarding-id-4.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioIdStep5 = require('../assets/audio/onboarding-id-5.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioEnStep1 = require('../assets/audio/onboarding-en-1.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioEnStep2 = require('../assets/audio/onboarding-en-2.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioEnStep3 = require('../assets/audio/onboarding-en-3.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioEnStep4 = require('../assets/audio/onboarding-en-4.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioEnStep5 = require('../assets/audio/onboarding-en-5.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioZhStep1 = require('../assets/audio/onboarding-zh-1.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioZhStep2 = require('../assets/audio/onboarding-zh-2.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioZhStep3 = require('../assets/audio/onboarding-zh-3.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioZhStep4 = require('../assets/audio/onboarding-zh-4.wav') as number
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioZhStep5 = require('../assets/audio/onboarding-zh-5.wav') as number

export const ONBOARDING_KEY = 'catetin.onboarding.done'

type Lang = 'id' | 'en' | 'zh'

const AUDIO: Record<Lang, [number, number, number, number, number]> = {
  id: [audioIdStep1, audioIdStep2, audioIdStep3, audioIdStep4, audioIdStep5],
  en: [audioEnStep1, audioEnStep2, audioEnStep3, audioEnStep4, audioEnStep5],
  zh: [audioZhStep1, audioZhStep2, audioZhStep3, audioZhStep4, audioZhStep5],
}

const STEPS = [
  {
    icon: Sparkles,
    title: { id: 'Hei, gue Kat!', en: "Hey, I'm Kat!", zh: '哟，我是 Kat！' },
    body: {
      id: 'Temen catat duit lo yang paling gak bikin pusing. Gue di sini buat bantu lo tau duit lo pergi ke mana.',
      en: "Your no-BS money tracker that actually makes sense. I'm here to help you stay on top of your spending.",
      zh: '你最省心的记账搭子。我在这里帮你搞清楚钱都花到哪去了。',
    },
  },
  {
    icon: Camera,
    title: { id: 'Catat dari mana aja', en: 'Log from anywhere', zh: '随时随地记账' },
    body: {
      id: 'Foto struk, kirim pesan di Telegram atau WhatsApp, atau ketik manual. Terserah lo, yang penting kecatat.',
      en: 'Snap a receipt, drop a message on Telegram or WhatsApp, or type it in manually. Whatever fits your vibe.',
      zh: '拍个小票，在 Telegram 或 WhatsApp 发消息，或者手动输入。随便你用哪种，只要记下来就好。',
    },
  },
  {
    icon: BarChart2,
    title: { id: 'Lihat semuanya', en: 'See everything', zh: '一目了然' },
    body: {
      id: 'Dashboard, grafik tren, kategori, dan budget alert. Gak ada lagi kejutan bokek di akhir bulan.',
      en: 'Dashboard, trend charts, categories, and budget alerts. No more surprise broke moments at the end of the month.',
      zh: '仪表盘、趋势图、分类明细还有预算提醒。再也不用月底突然发现没钱了。',
    },
  },
  {
    icon: Users,
    title: { id: 'Split bill? Beres', en: 'Splitting bills? Done', zh: 'AA 分账超省事' },
    body: {
      id: 'Cerita ke gue habis makan bareng, langsung gue hitung siapa bayar berapa. Mau rata atau sesuai porsi juga bisa.',
      en: "Tell me what you ate and I'll figure out who owes what. Equal or by portion, your call.",
      zh: '跟我说说你们吃了什么，我帮你算好谁该付多少。可以平摊也可以按比例。',
    },
  },
  {
    icon: Mic,
    title: { id: 'Level up ke Pro', en: 'Level up with Pro', zh: '升级 Pro 更爽' },
    body: {
      id: 'Cuma 59rb sebulan, setara 3.6 dolar. Dapet voice companion gue kapan aja. Kayak punya temen yang ngerti duit di kantong lo.',
      en: 'Under $4 a month. You get my voice companion anytime. Like a financial bestie in your pocket 24/7.',
      zh: '不到27块一个月。随时用我的语音助手，就像有个懂钱的朋友全天候陪着你。',
    },
  },
]

const TOTAL = STEPS.length

export default function OnboardingScreen() {
  const router = useRouter()
  const accent = useAccentColor()
  const { lang } = useLang()
  const [step, setStep] = useState(0)

  const player = useAudioPlayer(AUDIO[lang][0])

  const opacity = useSharedValue(1)
  const translateY = useSharedValue(0)
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
    setTimeout(() => {
      try {
        player.play()
      } catch {
        /* not ready */
      }
    }, 300)
  }, [])

  function applyStep(next: number) {
    setStep(next)
    const src = AUDIO[lang][next]
    if (src == null) return
    try {
      player.replace(src)
      setTimeout(() => {
        try {
          player.play()
        } catch {
          /* not ready */
        }
      }, 150)
    } catch {
      /* player busy */
    }
  }

  function animateTo(next: number) {
    opacity.value = withTiming(0, { duration: 140, easing: Easing.out(Easing.quad) }, () => {
      translateY.value = 12
      runOnJS(applyStep)(next)
      opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) })
      translateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
    })
  }

  async function finish() {
    try {
      player.pause()
    } catch {
      /* already stopped */
    }
    await AsyncStorage.setItem(ONBOARDING_KEY, '1').catch(() => {})
    router.replace('/(tabs)/index')
  }

  function next() {
    if (step < TOTAL - 1) {
      animateTo(step + 1)
    } else {
      void finish()
    }
  }

  const current = STEPS[step] ??
    STEPS[0] ?? {
      icon: Sparkles,
      title: { id: '', en: '', zh: '' },
      body: { id: '', en: '', zh: '' },
    }
  const Icon = current.icon

  const nextLabel =
    step < TOTAL - 1
      ? lang === 'zh'
        ? '下一步'
        : lang === 'id'
          ? 'Lanjut'
          : 'Next'
      : lang === 'zh'
        ? '走起'
        : lang === 'id'
          ? 'Mulai'
          : "Let's go"

  const skipLabel = lang === 'zh' ? '跳过' : lang === 'id' ? 'Lewati' : 'Skip'

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-center gap-2 pt-5">
        {STEPS.map((_, i) => (
          <Animated.View
            key={i}
            style={{
              height: 5,
              width: i === step ? 22 : 6,
              borderRadius: 99,
              backgroundColor: i <= step ? accent : '#d4d4d8',
            }}
          />
        ))}
      </View>

      <Animated.View
        style={[
          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
          animStyle,
        ]}
      >
        <View
          style={{
            height: 100,
            width: 100,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${accent}18`,
          }}
        >
          <Icon size={46} color={accent} />
        </View>

        <Text className="mt-8 text-center font-display text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
          {current.title[lang]}
        </Text>
        <Text className="mt-4 max-w-[290px] text-center font-sans text-base leading-7 text-zinc-500 dark:text-zinc-400">
          {current.body[lang]}
        </Text>
      </Animated.View>

      <View className="gap-2 px-6 pb-6">
        <Pressable
          onPress={next}
          className="items-center rounded-full bg-primary-600 py-4 active:opacity-80"
        >
          <Text className="font-sans text-base font-semibold text-white">{nextLabel}</Text>
        </Pressable>
        <Pressable onPress={() => void finish()} className="items-center py-2.5 active:opacity-60">
          <Text className="font-sans text-sm text-zinc-400">{skipLabel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
