import { ArrowDownRight, ArrowUpRight, LogOut, Plus, Sparkles } from 'lucide-react-native'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PaywallButton } from '~/components/paywall-button'
import { useAuth } from '~/hooks/use-auth'
import { signOutUser } from '~/lib/auth'

export default function Home() {
  const { user } = useAuth()
  const initial = (user?.displayName ?? user?.email ?? 'U').charAt(0).toUpperCase()
  const greet = user?.displayName ? `Hai, ${user.displayName.split(' ')[0]}` : 'Hai'

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-20"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-6 pt-4">
          <View>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">{greet}</Text>
            <Text className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Catetin
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Keluar"
            onPress={() => signOutUser().catch(() => {})}
            className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-900"
          >
            <LogOut size={18} color="#71717a" />
          </Pressable>
        </View>

        <View className="mx-6 mt-6 overflow-hidden rounded-3xl bg-primary-600 p-6">
          <Text className="text-xs font-medium uppercase tracking-[1.5px] text-primary-200">
            Saldo perkiraan bulan ini
          </Text>
          <Text className="mt-2 font-display text-4xl font-bold tracking-tight text-white">
            Rp 0
          </Text>
          <View className="mt-4 flex-row items-center gap-2">
            <View className="flex-row items-center gap-1 rounded-full bg-white/15 px-3 py-1">
              <ArrowUpRight size={12} color="#a5b4fc" />
              <Text className="text-xs font-medium text-primary-100">Pemasukan Rp 0</Text>
            </View>
            <View className="flex-row items-center gap-1 rounded-full bg-white/15 px-3 py-1">
              <ArrowDownRight size={12} color="#a5b4fc" />
              <Text className="text-xs font-medium text-primary-100">Pengeluaran Rp 0</Text>
            </View>
          </View>
        </View>

        <View className="mx-6 mt-6">
          <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-500 dark:text-zinc-400">
            Akun
          </Text>
          <View className="mt-2 flex-row items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
              <Text className="font-display text-lg font-bold text-primary-700 dark:text-primary-300">
                {initial}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {user?.displayName ?? 'Tamu Catetin'}
              </Text>
              {user?.email ? (
                <Text className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View className="mx-6 mt-6">
          <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-500 dark:text-zinc-400">
            Pro
          </Text>
          <View className="mt-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#4f46e5" />
              <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Catetin Pro
              </Text>
            </View>
            <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Voice companion unlimited, export PDF, multi wallet detail.
            </Text>
            <View className="mt-4">
              <PaywallButton />
            </View>
          </View>
        </View>

        <View className="mx-6 mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white/40 p-6 dark:border-zinc-700 dark:bg-zinc-900/40">
          <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Belum ada cerita bulan ini. Coba catat satu pengeluaran lewat Telegram bot
            @catetindobot, nanti muncul di sini.
          </Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-8 right-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah transaksi"
          className="h-14 w-14 items-center justify-center rounded-full bg-primary-600 shadow-lg active:opacity-90"
        >
          <Plus size={24} color="#ffffff" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
