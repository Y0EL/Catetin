import { useRouter } from 'expo-router'
import { Pencil, Search, Trash2 } from 'lucide-react-native'
import { useMemo, useRef, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { TransactionDto } from '@catetin/types'
import { Money } from '~/components/money'
import { ScreenFade } from '~/components/screen-fade'
import { TransactionCard } from '~/components/transaction-card'
import { useCategories } from '~/hooks/use-categories'
import { useSummary, currentMonth } from '~/hooks/use-summary'
import { useDeleteTransaction, useTransactions } from '~/hooks/use-transactions'
import { useWallets } from '~/hooks/use-wallets'
import { apiErrorMessage } from '~/lib/api'
import type { CategoryKey } from '~/lib/categories'
import { useEditStore } from '~/lib/edit-store'

function formatTxnTime(iso: string): string {
  const d = new Date(iso)
  const sameDay = d.toDateString() === new Date().toDateString()
  if (sameDay) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

export default function TransactionsTab() {
  const router = useRouter()
  const setEditing = useEditStore((s) => s.setEditing)
  const del = useDeleteTransaction()
  const [search, setSearch] = useState('')
  const summary = useSummary(currentMonth())
  const transactions = useTransactions(search.trim() ? { q: search.trim() } : {})
  const categories = useCategories()
  const wallets = useWallets()

  function onEdit(t: TransactionDto) {
    setEditing(t)
    router.push('/add-modal')
  }

  function onDelete(t: TransactionDto) {
    Alert.alert('Hapus transaksi?', 'Catatan ini bakal ilang permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () =>
          del.mutate(t.id, {
            onError: (err) => Alert.alert('Gagal hapus', apiErrorMessage(err)),
          }),
      },
    ])
  }

  const rows = transactions.data?.pages.flatMap((p) => p.transactions) ?? []
  const catName = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  )
  const walletName = useMemo(
    () => new Map((wallets.data ?? []).map((w) => [w.id, w.name])),
    [wallets.data],
  )
  const total = (summary.data?.income ?? 0) - (summary.data?.expense ?? 0)

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-32"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-4 pt-3">
            <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">Catatan</Text>
            <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Riwayat
            </Text>
          </View>

          <View className="mx-4 mt-4 flex-row items-center gap-3 rounded-input bg-white px-4 py-3 dark:bg-zinc-800">
            <Search size={18} color="#a1a1aa" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Cari deskripsi atau merchant"
              placeholderTextColor="#a1a1aa"
              className="flex-1 font-sans text-sm text-zinc-900 dark:text-zinc-100"
            />
          </View>

          <View className="mx-4 mt-5 rounded-3xl bg-primary-600 p-5">
            <Text className="font-sans text-xs font-medium uppercase tracking-widest text-primary-200">
              Net bulan ini
            </Text>
            <View className="mt-2">
              <Money value={total} size="lg" tone="onDark" compact />
            </View>
            <Text className="mt-2 font-sans text-xs text-primary-100">
              {rows.length} transaksi dimuat
            </Text>
          </View>

          <View className="mx-4 mt-6">
            {rows.length > 0 ? (
              <View className="overflow-hidden rounded-card bg-white dark:bg-zinc-800">
                {rows.map((t) => (
                  <SwipeableRow key={t.id} onEdit={() => onEdit(t)} onDelete={() => onDelete(t)}>
                    <View className="bg-white px-4 dark:bg-zinc-800">
                      <TransactionCard
                        category={(catName.get(t.categoryId) ?? 'lainnya') as CategoryKey}
                        title={t.description ?? t.merchant ?? 'Transaksi'}
                        wallet={walletName.get(t.walletId) ?? 'Wallet'}
                        amount={t.amount}
                        kind={t.kind === 'income' ? 'income' : 'expense'}
                        time={formatTxnTime(t.occurredAt)}
                      />
                    </View>
                  </SwipeableRow>
                ))}
              </View>
            ) : (
              <View className="items-center rounded-card bg-white px-6 py-10 dark:bg-zinc-800">
                <Text className="font-sans text-sm text-zinc-400">
                  {search.trim() ? 'Gak ada yang cocok.' : 'Belum ada transaksi.'}
                </Text>
              </View>
            )}

            {transactions.hasNextPage ? (
              <Pressable
                onPress={() => transactions.fetchNextPage()}
                disabled={transactions.isFetchingNextPage}
                className="mt-4 items-center rounded-full bg-white py-3 active:opacity-70 dark:bg-zinc-800"
              >
                <Text className="font-sans text-sm font-semibold text-primary-600 dark:text-primary-200">
                  {transactions.isFetchingNextPage ? 'Memuat' : 'Muat lagi'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function SwipeableRow({
  children,
  onEdit,
  onDelete,
}: {
  children: React.ReactNode
  onEdit: () => void
  onDelete: () => void
}) {
  const ref = useRef<SwipeableMethods>(null)
  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hapus transaksi"
          onPress={() => {
            ref.current?.close()
            onDelete()
          }}
          className="w-24 flex-col items-center justify-center bg-danger active:opacity-80"
        >
          <Trash2 size={20} color="#ffffff" />
          <Text className="mt-1 font-sans text-xs font-semibold text-white">Hapus</Text>
        </Pressable>
      )}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit transaksi"
          onPress={() => {
            ref.current?.close()
            onEdit()
          }}
          className="w-24 flex-col items-center justify-center bg-primary-600 active:opacity-80"
        >
          <Pencil size={20} color="#ffffff" />
          <Text className="mt-1 font-sans text-xs font-semibold text-white">Edit</Text>
        </Pressable>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  )
}
