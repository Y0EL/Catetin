import {
  Bell,
  ChevronRight,
  Globe,
  LogOut,
  MessageCircle,
  Moon,
  Shield,
  Sparkles,
} from 'lucide-react-native'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PaywallButton } from '~/components/paywall-button'
import { ScreenFade } from '~/components/screen-fade'
import { useAuth } from '~/hooks/use-auth'
import { signOutUser } from '~/lib/auth'

export default function SettingsTab() {
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

          <View className="mx-4 mt-5 flex-row items-center gap-4 rounded-card bg-white p-4 dark:bg-zinc-900">
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

          <Section title="Channel">
            <Row
              icon={<MessageCircle size={18} color="#4f46e5" />}
              label="Telegram"
              hint="@catetindobot"
              cta="Sambungin"
            />
            <Divider />
            <Row
              icon={<MessageCircle size={18} color="#a1a1aa" />}
              label="WhatsApp"
              hint="Coming soon"
              muted
            />
          </Section>

          <Section title="Aplikasi">
            <Row icon={<Moon size={18} color="#71717a" />} label="Tema" hint="Ikut sistem" />
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
              className="flex-row items-center justify-center gap-2 rounded-card bg-white py-3.5 active:opacity-80 dark:bg-zinc-900"
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mx-4 mt-6">
      <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        {title}
      </Text>
      <View className="mt-3 overflow-hidden rounded-card bg-white dark:bg-zinc-900">
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
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  cta?: string
  muted?: boolean
}) {
  return (
    <Pressable
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
        <Text className="font-sans text-sm font-semibold text-primary-600">{cta}</Text>
      ) : (
        <ChevronRight size={16} color="#a1a1aa" />
      )}
    </Pressable>
  )
}
