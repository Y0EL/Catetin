import { ChevronDown, Filter, Search } from 'lucide-react-native'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenFade } from '~/components/screen-fade'

const filters = ['Bulan ini', 'Kategori', 'Wallet']

export default function TransactionsTab() {
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
              <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">Catatan</Text>
              <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Riwayat
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter"
              className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-70 dark:bg-zinc-900"
            >
              <Filter size={18} color="#71717a" />
            </Pressable>
          </View>

          <View className="mx-4 mt-4 flex-row items-center gap-3 rounded-input bg-white px-4 py-3 dark:bg-zinc-900">
            <Search size={18} color="#a1a1aa" />
            <Text className="flex-1 font-sans text-sm text-zinc-400">
              Cari deskripsi atau angka
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-4 pt-4"
          >
            {filters.map((label) => (
              <Pressable
                key={label}
                className="flex-row items-center gap-1.5 rounded-full bg-white px-4 py-2 active:opacity-70 dark:bg-zinc-900"
              >
                <Text className="font-sans text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  {label}
                </Text>
                <ChevronDown size={14} color="#a1a1aa" />
              </Pressable>
            ))}
          </ScrollView>

          <View className="mx-4 mt-5 rounded-3xl bg-primary-600 p-5">
            <Text className="font-sans text-xs font-medium uppercase tracking-widest text-primary-200">
              Total bulan ini
            </Text>
            <Text
              className="mt-2 font-display text-3xl font-extrabold text-white"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              Rp 0
            </Text>
            <Text className="mt-2 font-sans text-xs text-primary-100">0 transaksi tercatat</Text>
          </View>

          <View className="mx-4 mt-6">
            <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Hari ini
            </Text>
            <View className="mt-3 items-center rounded-card bg-white px-6 py-8 dark:bg-zinc-900">
              <Text className="font-sans text-sm text-zinc-400">Belum ada transaksi.</Text>
            </View>
          </View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}
