import { useRouter } from 'expo-router'
import { ArrowDownLeft, ArrowUpRight, Bell, Camera, Plus, Sparkles } from 'lucide-react-native'
import { useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CardGlow } from '~/components/card-glow'
import { Money } from '~/components/money'
import { NoteCard } from '~/components/note-card'
import { ScreenFade } from '~/components/screen-fade'
import { TransactionCard } from '~/components/transaction-card'
import { useAuth } from '~/hooks/use-auth'
import { useCategories } from '~/hooks/use-categories'
import { useSummary, currentMonth } from '~/hooks/use-summary'
import { useTransactions } from '~/hooks/use-transactions'
import { useWallets } from '~/hooks/use-wallets'
import type { CategoryKey } from '~/lib/categories'

const cardShadow = {
  shadowColor: '#18181b',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.25,
  shadowRadius: 20,
  elevation: 8,
}

function formatTxnTime(iso: string): string {
  const d = new Date(iso)
  const sameDay = d.toDateString() === new Date().toDateString()
  if (sameDay) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

export default function HomeTab() {
  const { user } = useAuth()
  const router = useRouter()
  const firstName = user?.displayName?.split(' ')[0] ?? 'kamu'
  const periodChip = new Date().toLocaleDateString('id-ID', { month: 'long' })

  const summary = useSummary(currentMonth())
  const transactions = useTransactions({})
  const categories = useCategories()
  const wallets = useWallets()

  const recent = transactions.data?.pages[0]?.transactions.slice(0, 5) ?? []
  const catName = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  )
  const walletName = useMemo(
    () => new Map((wallets.data ?? []).map((w) => [w.id, w.name])),
    [wallets.data],
  )

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
            {(summary.data?.income ?? 0) > 0 ? <CardGlow position="bottomLeft" /> : null}
            <View className="flex-row items-center justify-between">
              <Text className="font-sans text-sm text-primary-200">Pengeluaran bulan ini</Text>
              <View className="rounded-full bg-white/15 px-2.5 py-1">
                <Text className="font-sans text-xs font-medium text-primary-100">{periodChip}</Text>
              </View>
            </View>
            <View className="mt-3">
              <Money value={summary.data?.expense ?? 0} size="hero" tone="onDark" />
            </View>

            <View className="mt-6 flex-row items-stretch">
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <ArrowDownLeft size={14} color="#a1a1aa" />
                  <Text className="font-sans text-xs text-primary-100">Pemasukan</Text>
                </View>
                <View className="mt-1">
                  <Money value={summary.data?.income ?? 0} size="lg" tone="onDark" />
                </View>
              </View>
              <View className="mx-4 w-px bg-white/20" />
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <ArrowUpRight size={14} color="#a1a1aa" />
                  <Text className="font-sans text-xs text-primary-100">Pengeluaran</Text>
                </View>
                <View className="mt-1">
                  <Money value={summary.data?.expense ?? 0} size="lg" tone="onDark" />
                </View>
              </View>
            </View>
          </View>

          <View className="mx-4 mt-4 flex-row gap-3">
            <QuickAction
              icon={<Camera size={20} color="#18181b" />}
              label="Scan struk"
              onPress={() => router.push('/add-modal')}
            />
            <QuickAction
              icon={<Plus size={20} color="#18181b" />}
              label="Catat manual"
              onPress={() => router.push('/add-modal')}
            />
          </View>

          <View className="mt-8 px-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Transaksi terbaru
              </Text>
              {recent.length > 0 ? (
                <Pressable
                  onPress={() => router.push('/(tabs)/transactions')}
                  className="active:opacity-60"
                >
                  <Text className="font-sans text-sm font-semibold text-primary-600">
                    Lihat semua
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {recent.length > 0 ? (
              <View className="mt-3">
                <NoteCard className="px-4 pt-4">
                  {recent.map((t) => (
                    <TransactionCard
                      key={t.id}
                      category={(catName.get(t.categoryId) ?? 'lainnya') as CategoryKey}
                      title={t.description ?? t.merchant ?? 'Transaksi'}
                      wallet={walletName.get(t.walletId) ?? 'Wallet'}
                      amount={t.amount}
                      kind={t.kind === 'income' ? 'income' : 'expense'}
                      time={formatTxnTime(t.occurredAt)}
                    />
                  ))}
                </NoteCard>
              </View>
            ) : (
              <View className="mt-3">
                <NoteCard className="items-center px-6 pb-10 pt-8">
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950">
                    <Sparkles size={24} color="#18181b" />
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
                </NoteCard>
              </View>
            )}
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
