import {
  ArrowDownRight,
  Camera,
  MessageCircle,
  Mic,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react-native'
import { Platform, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GoogleSignInButton } from '~/components/google-sign-in-button'

function hasOAuthConfigured(): boolean {
  if (Platform.OS === 'web') return Boolean(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB)
  if (Platform.OS === 'ios') {
    return Boolean(
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    )
  }
  if (Platform.OS === 'android') {
    return Boolean(
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ??
        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    )
  }
  return false
}

export default function LoginScreen() {
  const ready = hasOAuthConfigured()

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pb-8 pt-6">
          <BrandMark />
          <Hero />
          <MockPreview />
          <Features />
        </View>

        <View className="px-6 pb-10">
          {ready ? <GoogleSignInButton /> : <SetupNotice />}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function BrandMark() {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-9 w-9 items-center justify-center rounded-2xl bg-primary-600">
        <Text className="font-display text-lg font-bold text-white">C</Text>
      </View>
      <Text className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Catetin
      </Text>
    </View>
  )
}

function Hero() {
  return (
    <View className="mt-12">
      <Text className="font-display text-[40px] font-bold leading-[44px] tracking-tight text-zinc-950 dark:text-zinc-50">
        Catat duit,{'\n'}dari mana aja.
      </Text>
      <Text className="mt-4 text-base leading-6 text-zinc-500 dark:text-zinc-400">
        Lewat chat WhatsApp, Telegram, atau langsung di app. Catetan lo nempel di tempat lo udah
        biasa ngobrol tiap hari.
      </Text>
    </View>
  )
}

function MockPreview() {
  return (
    <View className="mt-10">
      <View className="overflow-hidden rounded-2xl bg-primary-600 p-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-medium uppercase tracking-[1.5px] text-primary-200">
            Bulan ini
          </Text>
          <View className="h-7 w-7 items-center justify-center rounded-full bg-white/15">
            <ArrowDownRight size={16} color="#ffffff" />
          </View>
        </View>
        <Text className="mt-3 font-display text-4xl font-bold tracking-tight text-white">
          Rp 2.450.000
        </Text>
        <View className="mt-4 flex-row items-center gap-1.5">
          <View className="h-1.5 w-1.5 rounded-full bg-primary-200" />
          <Text className="text-sm text-primary-100">12 persen lebih hemat dari April</Text>
        </View>
      </View>

      <View className="-mt-3 ml-3 mr-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <TxnRow
          icon={<UtensilsCrossed size={18} color="#059669" />}
          tint="bg-emerald-50 dark:bg-emerald-900/30"
          title="Kopi pagi"
          source="via Telegram"
          time="08:24"
          amount="-Rp 28.000"
        />
        <View className="my-3 h-px bg-zinc-100 dark:bg-zinc-800" />
        <TxnRow
          icon={<ShoppingBag size={18} color="#4f46e5" />}
          tint="bg-primary-50 dark:bg-primary-900/40"
          title="Indomaret"
          source="OCR struk"
          time="kemarin"
          amount="-Rp 124.500"
        />
      </View>
    </View>
  )
}

function TxnRow({
  icon,
  tint,
  title,
  source,
  time,
  amount,
}: {
  icon: React.ReactNode
  tint: string
  title: string
  source: string
  time: string
  amount: string
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className={`h-10 w-10 items-center justify-center rounded-xl ${tint}`}>{icon}</View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</Text>
        <Text className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {source} {'•'} {time}
        </Text>
      </View>
      <Text className="font-semibold text-zinc-900 dark:text-zinc-100">{amount}</Text>
    </View>
  )
}

function Features() {
  return (
    <View className="mt-10 gap-3">
      <FeatureRow
        icon={<MessageCircle size={18} color="#4f46e5" />}
        title="Chat di WA atau Telegram"
        body='Tinggal tulis "makan 35rb", langsung kecatat.'
      />
      <FeatureRow
        icon={<Camera size={18} color="#4f46e5" />}
        title="Foto struk, beres"
        body="OCR pakai Gemini, pecah per item otomatis."
      />
      <FeatureRow
        icon={<Mic size={18} color="#4f46e5" />}
        title="Temen curhat soal duit"
        body="Voice companion 10 menit per hari, gratis."
      />
    </View>
  )
}

function FeatureRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <View className="flex-row items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/40">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</Text>
        <Text className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{body}</Text>
      </View>
    </View>
  )
}

function SetupNotice() {
  return (
    <View className="rounded-2xl border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/40">
      <Text className="text-sm font-semibold text-amber-700 dark:text-amber-300">
        Google Sign In belum aktif
      </Text>
      <Text className="mt-2 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
        Isi EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB di apps/mobile/.env, lalu restart server. Web client
        ID ada di Firebase Console pada Authentication, Sign in method, Google, Web SDK
        configuration.
      </Text>
    </View>
  )
}
