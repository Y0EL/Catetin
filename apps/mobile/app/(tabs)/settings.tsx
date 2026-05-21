import { useRouter } from 'expo-router'
import {
  Bell,
  ChevronRight,
  Globe,
  LogOut,
  MessageCircle,
  Monitor,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Target,
} from 'lucide-react-native'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PaywallButton } from '~/components/paywall-button'
import { ScreenFade } from '~/components/screen-fade'
import { TelegramLinkRow } from '~/components/telegram-link-row'
import { useAuth } from '~/hooks/use-auth'
import { signOutUser } from '~/lib/auth'
import { useTheme, type ThemePref } from '~/lib/theme'

export default function SettingsTab() {
  const router = useRouter()
  const { user } = useAuth()
  const initial = (user?.displayName ?? user?.email ?? 'C').charAt(0).toUpperCase()

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-32"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-4 pt-3">
            <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">Akun lo</Text>
            <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Pengaturan
            </Text>
          </View>

          <View className="mx-4 mt-5 flex-row items-center gap-4 rounded-card bg-white p-4 dark:bg-zinc-800">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
              <Text className="font-display text-xl font-bold text-primary-700 dark:text-primary-300">
                {initial}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {user?.displayName ?? 'Tamu Catetin'}
              </Text>
              {user?.email ? (
                <Text className="mt-0.5 font-sans text-sm text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="mx-4 mt-5 overflow-hidden rounded-card bg-primary-600 p-5">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#ffffff" />
              <Text className="font-display text-base font-bold text-white">Catetin Pro</Text>
            </View>
            <Text className="mt-1 font-sans text-sm leading-5 text-primary-100">
              Voice unlimited, PDF bulanan, multi wallet. Rp 39.000 per bulan.
            </Text>
            <View className="mt-4">
              <PaywallButton />
            </View>
          </View>

          <Section title="Keuangan">
            <Row
              icon={<Target size={18} color="#71717a" />}
              label="Budget per kategori"
              hint="Atur batas bulanan atau mingguan"
              onPress={() => router.push('/budgets')}
            />
          </Section>

          <Section title="Channel">
            <TelegramLinkRow />
            <Divider />
            <Row
              icon={<MessageCircle size={18} color="#a1a1aa" />}
              label="WhatsApp"
              hint="Coming soon"
              muted
            />
          </Section>

          <Section title="Aplikasi">
            <ThemeSelector />
            <Divider />
            <Row icon={<Bell size={18} color="#71717a" />} label="Notifikasi" hint="Aktif" />
            <Divider />
            <Row icon={<Globe size={18} color="#71717a" />} label="Bahasa" hint="Indonesia" />
          </Section>

          <Section title="Tentang">
            <Row icon={<Shield size={18} color="#71717a" />} label="Kebijakan privasi" />
          </Section>

          <View className="mx-4 mt-6">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar dari Catetin"
              onPress={() => signOutUser().catch(() => {})}
              className="flex-row items-center justify-center gap-2 rounded-card bg-white py-3.5 active:opacity-80 dark:bg-zinc-800"
            >
              <LogOut size={16} color="#dc2626" />
              <Text className="font-sans text-sm font-semibold text-danger">Keluar</Text>
            </Pressable>
            <Text className="mt-5 text-center font-sans text-xs text-zinc-400">Catetin v0.1.0</Text>
          </View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}

const themeOptions: { key: ThemePref; label: string; icon: typeof Sun }[] = [
  { key: 'light', label: 'Terang', icon: Sun },
  { key: 'dark', label: 'Gelap', icon: Moon },
  { key: 'system', label: 'Sistem', icon: Monitor },
]

function ThemeSelector() {
  const { pref, setPref } = useTheme()

  return (
    <View className="px-4 py-3.5">
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Moon size={18} color="#71717a" />
        </View>
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">Tema</Text>
      </View>
      <View className="mt-3 flex-row gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
        {themeOptions.map((opt) => {
          const active = pref === opt.key
          const Icon = opt.icon
          return (
            <Pressable
              key={opt.key}
              accessibilityRole="button"
              accessibilityLabel={`Tema ${opt.label}`}
              accessibilityState={active ? { selected: true } : {}}
              onPress={() => setPref(opt.key)}
              className={
                active
                  ? 'flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-primary-600 py-2'
                  : 'flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2 active:opacity-60'
              }
            >
              <Icon size={15} color={active ? '#ffffff' : '#71717a'} />
              <Text
                className={
                  active
                    ? 'font-sans text-xs font-semibold text-white'
                    : 'font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
                }
              >
                {opt.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mx-4 mt-6">
      <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        {title}
      </Text>
      <View className="mt-3 overflow-hidden rounded-card bg-white dark:bg-zinc-800">
        {children}
      </View>
    </View>
  )
}

function Divider() {
  return <View className="ml-16 h-px bg-zinc-100 dark:bg-zinc-800" />
}

function Row({
  icon,
  label,
  hint,
  cta,
  muted,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  cta?: string
  muted?: boolean
  onPress?: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        muted
          ? 'flex-row items-center gap-3 px-4 py-3.5 opacity-55'
          : 'flex-row items-center gap-3 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800'
      }
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">{label}</Text>
        {hint ? (
          <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">{hint}</Text>
        ) : null}
      </View>
      {cta ? (
        <Text className="font-sans text-sm font-semibold text-primary-600 dark:text-primary-200">
          {cta}
        </Text>
      ) : (
        <ChevronRight size={16} color="#a1a1aa" />
      )}
    </Pressable>
  )
}
