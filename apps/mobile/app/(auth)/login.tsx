import { Camera, MessageCircle, Mic } from 'lucide-react-native'
import { Image, Platform, Pressable, Text, View } from 'react-native'
import iconImage from '~/assets/icon.png'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GoogleSignInButton } from '~/components/google-sign-in-button'
import { useAccentColor } from '~/lib/use-accent-color'
import { useLang, useT, type Lang } from '~/lib/lang-context'

function hasOAuthConfigured(): boolean {
  if (Platform.OS === 'web') return Boolean(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB)
  if (Platform.OS === 'ios') {
    return Boolean(
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    )
  }
  if (Platform.OS === 'android') {
    return Boolean(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID)
  }
  return false
}

const LANG_OPTIONS: { key: Lang; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'en', label: 'EN' },
  { key: 'zh', label: '中' },
]

export default function LoginScreen() {
  const ready = hasOAuthConfigured()
  const accent = useAccentColor()
  const { lang, setLang } = useLang()
  const t = useT()

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top', 'bottom']}>
      <View className="flex-row justify-end px-4 pt-3">
        <View className="flex-row overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          {LANG_OPTIONS.map((opt) => {
            const active = lang === opt.key
            return (
              <Pressable
                key={opt.key}
                onPress={() => setLang(opt.key)}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
                className={`px-3.5 py-1.5 ${active ? 'bg-primary-600' : ''}`}
              >
                <Text
                  className={`font-sans text-xs font-semibold ${active ? 'text-white' : 'text-zinc-600 dark:text-zinc-300'}`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View className="flex-1 justify-between px-6 pb-8 pt-6">
        <View>
          <Image source={iconImage} className="h-16 w-16 rounded-2xl" resizeMode="cover" />
          <Text className="mt-8 font-display text-4xl font-extrabold leading-[44px] text-zinc-900 dark:text-zinc-50">
            {t('login_headline')}
          </Text>
          <Text className="mt-4 max-w-[300px] font-sans text-base leading-6 text-zinc-500 dark:text-zinc-400">
            {t('login_subtitle')}
          </Text>
        </View>

        <View className="gap-3">
          <Feature
            icon={<MessageCircle size={20} color={accent} />}
            title={t('login_feature_chat_title')}
            body={t('login_feature_chat_body')}
          />
          <Feature
            icon={<Camera size={20} color={accent} />}
            title={t('login_feature_scan_title')}
            body={t('login_feature_scan_body')}
          />
          <Feature
            icon={<Mic size={20} color={accent} />}
            title={t('login_feature_companion_title')}
            body={t('login_feature_companion_body')}
          />
        </View>

        <View className="gap-3">
          {ready ? (
            <GoogleSignInButton />
          ) : (
            <View className="rounded-card bg-warning/10 p-4">
              <Text className="font-sans text-sm font-semibold text-warning">
                {t('login_oauth_not_ready')}
              </Text>
              <Text className="mt-1 font-sans text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                {t('login_oauth_env_hint')}
              </Text>
            </View>
          )}
          <Text className="text-center font-sans text-xs leading-5 text-zinc-400">
            {t('login_terms')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-card bg-white p-4 dark:bg-zinc-800">
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
