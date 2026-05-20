import { ArrowDownLeft, ArrowUpRight, Bell, Camera, Plus, Sparkles } from 'lucide-react-native'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ScreenFade } from '~/components/screen-fade'
import { useAuth } from '~/hooks/use-auth'

const cardShadow = {
  shadowColor: '#4f46e5',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.25,
  shadowRadius: 20,
  elevation: 8,
}

export default function HomeTab() {
  const { user } = useAuth()
  const router = useRouter()
  const firstName = user?.displayName?.split(' ')[0] ?? 'kamu'
  const periodChip = new Date().toLocaleDateString('id-ID', { month: 'long' })

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-32"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between px-4 pt-3">
            <View>
              <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">
                Halo lagi, {firstName}
              </Text>
              <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Catetin
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifikasi"
              className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-70 dark:bg-zinc-900"
            >
              <Bell size={20} color="#71717a" />
            </Pressable>
          </View>

          <View
            className="mx-4 mt-5 overflow-hidden rounded-3xl bg-primary-600 p-6"
            style={cardShadow}
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-sans text-sm text-primary-200">Pengeluaran bulan ini</Text>
              <View className="rounded-full bg-white/15 px-2.5 py-1">
                <Text className="font-sans text-xs font-medium text-primary-100">{periodChip}</Text>
              </View>
            </View>
            <Text
              className="mt-3 font-display text-5xl font-extrabold text-white"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              Rp 0
            </Text>

            <View className="mt-6 flex-row items-stretch">
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <ArrowDownLeft size={14} color="#a5b4fc" />
                  <Text className="font-sans text-xs text-primary-100">Pemasukan</Text>
                </View>
                <Text
                  className="mt-1 font-display text-lg font-bold text-white"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  Rp 0
                </Text>
              </View>
              <View className="mx-4 w-px bg-white/20" />
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <ArrowUpRight size={14} color="#a5b4fc" />
                  <Text className="font-sans text-xs text-primary-100">Pengeluaran</Text>
                </View>
                <Text
                  className="mt-1 font-display text-lg font-bold text-white"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  Rp 0
                </Text>
              </View>
            </View>
          </View>

          <View className="mx-4 mt-4 flex-row gap-3">
            <QuickAction
              icon={<Camera size={20} color="#4f46e5" />}
              label="Scan struk"
              onPress={() => router.push('/add-modal')}
            />
            <QuickAction
              icon={<Plus size={20} color="#4f46e5" />}
              label="Catat manual"
              onPress={() => router.push('/add-modal')}
            />
          </View>

          <View className="mt-8 px-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Transaksi terbaru
              </Text>
              <Pressable className="active:opacity-60">
                <Text className="font-sans text-sm font-semibold text-primary-600">
                  Lihat semua
                </Text>
              </Pressable>
            </View>

            <View className="mt-3 items-center rounded-card bg-white px-6 py-10 dark:bg-zinc-900">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950">
                <Sparkles size={24} color="#4f46e5" />
              </View>
              <Text className="mt-4 font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
                Belum ada cerita bulan ini
              </Text>
              <Text className="mt-1 max-w-[260px] text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
                Catat satu pengeluaran biar Catetin bisa mulai bantu lihat polanya.
              </Text>
              <Pressable
                onPress={() => router.push('/add-modal')}
                className="mt-5 rounded-full bg-primary-600 px-5 py-2.5 active:opacity-90"
              >
                <Text className="font-sans text-sm font-semibold text-white">Mulai catat</Text>
              </Pressable>
            </View>
          </View>

          <View className="mt-8 px-4">
            <Text className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Catat lewat chat
            </Text>
            <View className="mt-3 gap-3">
              <ChannelCard name="Telegram" handle="@catetindobot" cta="Sambungin" />
              <ChannelCard name="WhatsApp" handle="Coming soon" muted />
            </View>
          </View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-1 flex-row items-center gap-2 rounded-card bg-white px-4 py-3.5 active:opacity-80 dark:bg-zinc-900"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950">
        {icon}
      </View>
      <Text className="font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {label}
      </Text>
    </Pressable>
  )
}

function ChannelCard({
  name,
  handle,
  cta,
  muted,
}: {
  name: string
  handle: string
  cta?: string
  muted?: boolean
}) {
  return (
    <View
      className={
        muted
          ? 'flex-row items-center justify-between rounded-card bg-white px-4 py-4 opacity-55 dark:bg-zinc-900'
          : 'flex-row items-center justify-between rounded-card bg-white px-4 py-4 dark:bg-zinc-900'
      }
    >
      <View>
        <Text className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {name}
        </Text>
        <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">{handle}</Text>
      </View>
      {cta ? (
        <Pressable className="rounded-full bg-primary-50 px-4 py-2 active:opacity-70 dark:bg-primary-950">
          <Text className="font-sans text-sm font-semibold text-primary-600 dark:text-primary-300">
            {cta}
          </Text>
        </Pressable>
      ) : (
        <Text className="font-sans text-xs text-zinc-400">Segera</Text>
      )}
    </View>
  )
}
