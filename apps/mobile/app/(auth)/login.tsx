import { Camera, MessageCircle, Mic } from 'lucide-react-native'
import { Platform, Text, View } from 'react-native'
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
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top', 'bottom']}>
      <View className="flex-1 justify-between px-6 pb-8 pt-12">
        <View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-600">
            <Text className="font-display text-2xl font-extrabold text-white">C</Text>
          </View>
          <Text className="mt-8 font-display text-4xl font-extrabold leading-[44px] text-zinc-900 dark:text-zinc-50">
            Catat duit,{'\n'}dari mana aja.
          </Text>
          <Text className="mt-4 max-w-[300px] font-sans text-base leading-6 text-zinc-500 dark:text-zinc-400">
            Lewat WhatsApp, Telegram, atau langsung di app. Catetan lo nempel di tempat lo udah
            biasa ngobrol.
          </Text>
        </View>

        <View className="gap-3">
          <Feature
            icon={<MessageCircle size={20} color="#4f46e5" />}
            title="Catat lewat chat"
            body='Tulis "makan 35rb", langsung kecatat.'
          />
          <Feature
            icon={<Camera size={20} color="#4f46e5" />}
            title="Scan struk"
            body="OCR otomatis pecah per item."
          />
          <Feature
            icon={<Mic size={20} color="#4f46e5" />}
            title="Temen curhat"
            body="Ngobrol soal duit, 10 menit gratis."
          />
        </View>

        <View className="gap-3">
          {ready ? (
            <GoogleSignInButton />
          ) : (
            <View className="rounded-card bg-warning/10 p-4">
              <Text className="font-sans text-sm font-semibold text-warning">
                Google Sign In belum aktif
              </Text>
              <Text className="mt-1 font-sans text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                Isi EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB di apps/mobile/.env lalu restart server.
              </Text>
            </View>
          )}
          <Text className="text-center font-sans text-xs leading-5 text-zinc-400">
            Dengan lanjut lo setuju ke ketentuan dan kebijakan privasi Catetin.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-card bg-white p-4 dark:bg-zinc-900">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </Text>
        <Text className="mt-0.5 font-sans text-sm text-zinc-500 dark:text-zinc-400">{body}</Text>
      </View>
    </View>
  )
}
