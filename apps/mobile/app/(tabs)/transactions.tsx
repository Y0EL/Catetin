import { useRouter } from 'expo-router'
import { Check, CheckSquare, Pencil, Search, Trash2, X } from 'lucide-react-native'
import { useMemo, useRef, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
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
import {
  useBulkDeleteTransactions,
  useDeleteTransaction,
  useTransactions,
} from '~/hooks/use-transactions'
import { useWallets } from '~/hooks/use-wallets'
import { apiErrorMessage } from '~/lib/api'
import type { CategoryKey } from '~/lib/categories'
import { useEditTransaction } from '~/lib/edit-store'

function formatTxnTime(iso: string): string {
  const d = new Date(iso)
  const sameDay = d.toDateString() === new Date().toDateString()
  if (sameDay) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

export default function TransactionsTab() {
  const router = useRouter()
  const { setEditing } = useEditTransaction()
  const del = useDeleteTransaction()
  const bulkDel = useBulkDeleteTransactions()
  const [search, setSearch] = useState('')
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<{ kind: 'single' | 'bulk'; ids: string[] } | null>(null)
  const summary = useSummary(currentMonth())
  const transactions = useTransactions(search.trim() ? { q: search.trim() } : {})
  const categories = useCategories()
  const wallets = useWallets()

  function onEdit(t: TransactionDto) {
    setEditing(t)
    router.push('/add-modal')
  }

  function onDelete(t: TransactionDto) {
    setConfirm({ kind: 'single', ids: [t.id] })
  }

  function enterSelectionWith(id: string) {
    setSelecting(true)
    setSelected(new Set([id]))
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function cancelSelection() {
    setSelecting(false)
    setSelected(new Set())
  }

  function selectAll() {
    setSelected(new Set(rows.map((r) => r.id)))
  }

  function bulkDelete() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setConfirm({ kind: 'bulk', ids })
  }

  function runConfirm() {
    if (!confirm) return
    if (confirm.kind === 'single') {
      const id = confirm.ids[0]
      if (!id) return
      del.mutate(id, {
        onSuccess: () => setConfirm(null),
        onError: (err) => {
          setConfirm(null)
          Alert.alert('Gagal hapus', apiErrorMessage(err))
        },
      })
      return
    }
    bulkDel.mutate(confirm.ids, {
      onSuccess: () => {
        setConfirm(null)
        cancelSelection()
      },
      onError: (err) => {
        setConfirm(null)
        Alert.alert('Gagal hapus', apiErrorMessage(err))
      },
    })
  }

  const rows = transactions.data?.pages.flatMap((p) => p.transactions) ?? []
  const allSelected = rows.length > 0 && selected.size === rows.length
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
          {selecting ? (
            <View className="flex-row items-center justify-between gap-2 px-4 pt-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Batal pilih"
                onPress={cancelSelection}
                className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70 dark:bg-zinc-800"
              >
                <X size={18} color="#71717a" />
              </Pressable>
              <Text className="flex-1 font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {selected.size} dipilih
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={allSelected ? 'Kosongin pilihan' : 'Pilih semua'}
                onPress={allSelected ? cancelSelection : selectAll}
                className="rounded-full bg-zinc-100 px-3 py-2 active:opacity-70 dark:bg-zinc-800"
              >
                <Text className="font-sans text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  {allSelected ? 'Kosongin' : 'Semua'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Hapus ${selected.size} transaksi`}
                onPress={bulkDelete}
                disabled={selected.size === 0 || bulkDel.isPending}
                className="flex-row items-center gap-1 rounded-full bg-danger px-3 py-2 active:opacity-80 disabled:opacity-40"
              >
                <Trash2 size={14} color="#ffffff" />
                <Text className="font-sans text-xs font-semibold text-white">{selected.size}</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-end justify-between px-4 pt-3">
              <View>
                <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">Catatan</Text>
                <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Riwayat
                </Text>
              </View>
              {rows.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Pilih banyak"
                  onPress={() => setSelecting(true)}
                  className="flex-row items-center gap-1 rounded-full bg-white px-3 py-2 active:opacity-70 dark:bg-zinc-800"
                >
                  <CheckSquare size={14} color="#71717a" />
                  <Text className="font-sans text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                    Pilih
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}

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
                {rows.map((t) => {
                  const card = (
                    <TransactionCard
                      category={(catName.get(t.categoryId) ?? 'lainnya') as CategoryKey}
                      title={t.description ?? t.merchant ?? 'Transaksi'}
                      wallet={walletName.get(t.walletId) ?? 'Wallet'}
                      amount={t.amount}
                      kind={t.kind === 'income' ? 'income' : 'expense'}
                      time={formatTxnTime(t.occurredAt)}
                    />
                  )
                  if (selecting) {
                    const checked = selected.has(t.id)
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => toggleSelected(t.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked }}
                        className={
                          checked
                            ? 'flex-row items-center gap-3 bg-primary-50 px-4 dark:bg-primary-900/40'
                            : 'flex-row items-center gap-3 bg-white px-4 active:opacity-70 dark:bg-zinc-800'
                        }
                      >
                        <View
                          className={
                            checked
                              ? 'h-5 w-5 items-center justify-center rounded-md bg-primary-600'
                              : 'h-5 w-5 items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-600'
                          }
                        >
                          {checked ? <Check size={14} color="#ffffff" /> : null}
                        </View>
                        <View className="flex-1">{card}</View>
                      </Pressable>
                    )
                  }
                  return (
                    <SwipeableRow key={t.id} onEdit={() => onEdit(t)} onDelete={() => onDelete(t)}>
                      <Pressable
                        onLongPress={() => enterSelectionWith(t.id)}
                        delayLongPress={350}
                        className="bg-white px-4 dark:bg-zinc-800"
                      >
                        {card}
                      </Pressable>
                    </SwipeableRow>
                  )
                })}
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

      <Modal
        visible={confirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirm(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full rounded-3xl bg-white p-6 dark:bg-zinc-900">
            <View className="h-12 w-12 items-center justify-center self-start rounded-full bg-danger/10">
              <Trash2 size={22} color="#dc2626" />
            </View>
            <Text className="mt-4 font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {confirm?.kind === 'bulk'
                ? `Hapus ${confirm.ids.length} transaksi?`
                : 'Hapus transaksi?'}
            </Text>
            <Text className="mt-1 font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
              {confirm?.kind === 'bulk'
                ? 'Catatan-catatan ini bakal ilang permanen, gak bisa balik lagi.'
                : 'Catatan ini bakal ilang permanen, gak bisa balik lagi.'}
            </Text>
            <View className="mt-5 gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hapus"
                onPress={runConfirm}
                disabled={del.isPending || bulkDel.isPending}
                className="items-center rounded-full bg-danger py-3.5 active:opacity-90 disabled:opacity-50"
              >
                <Text className="font-sans text-sm font-semibold text-white">
                  {del.isPending || bulkDel.isPending ? 'Lagi ngehapus' : 'Iya, hapus'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Batal"
                onPress={() => setConfirm(null)}
                className="items-center rounded-full bg-zinc-100 py-3.5 active:opacity-70 dark:bg-zinc-800"
              >
                <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  Eh, batal
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
