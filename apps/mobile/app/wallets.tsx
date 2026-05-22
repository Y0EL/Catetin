import { formatRupiah } from '@catetin/chat-core'
import type { CreateWalletInput } from '@catetin/types'
import { useRouter } from 'expo-router'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NoteCard } from '~/components/note-card'
import { ScreenFade } from '~/components/screen-fade'
import { useArchiveWallet, useCreateWallet, useWallets } from '~/hooks/use-wallets'
import { useAccentColor } from '~/lib/use-accent-color'

type WalletType = 'cash' | 'bank' | 'ewallet' | 'credit' | 'other'

const TYPE_LABELS: Record<WalletType, string> = {
  cash: 'Tunai',
  bank: 'Bank',
  ewallet: 'E-Wallet',
  credit: 'Kartu Kredit',
  other: 'Lainnya',
}

const PALETTE = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
]

export default function WalletsScreen() {
  const router = useRouter()
  const accent = useAccentColor()
  const { data: walletList = [] } = useWallets()
  const create = useCreateWallet()
  const archive = useArchiveWallet()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<WalletType>('cash')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState(PALETTE[0] ?? '#6366f1')

  function resetForm() {
    setName('')
    setType('cash')
    setBalance('')
    setColor(PALETTE[0] ?? '#6366f1')
    setShowForm(false)
  }

  function onSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    const initialBalance = parseInt(balance.replace(/\D/g, ''), 10) || 0
    const input: CreateWalletInput = { name: trimmed, type, color, initialBalance }
    create.mutate(input, { onSuccess: resetForm })
  }

  function onArchive(id: string, walletName: string) {
    Alert.alert(
      'Hapus wallet?',
      `"${walletName}" akan dihapus. Transaksi yang ada tidak terpengaruh.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => archive.mutate(id) },
      ],
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <View className="flex-row items-center justify-between px-2 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
            accessibilityLabel="Kembali"
          >
            <ChevronLeft size={24} color={accent} />
          </Pressable>
          <Text className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Wallet
          </Text>
          <Pressable
            onPress={() => setShowForm(true)}
            className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 active:opacity-70 dark:bg-zinc-800"
            accessibilityLabel="Tambah wallet"
          >
            <Plus size={18} color={accent} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-32 gap-3 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {showForm && (
            <NoteCard className="gap-3 p-4">
              <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Tambah Wallet
              </Text>

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nama wallet (contoh: BCA, GoPay)"
                placeholderTextColor="#a1a1aa"
                className="rounded-xl bg-zinc-100 px-4 py-3 font-sans text-sm text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
              />

              <View className="flex-row flex-wrap gap-2">
                {(Object.keys(TYPE_LABELS) as WalletType[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setType(t)}
                    className={
                      type === t
                        ? 'rounded-full bg-primary-600 px-3 py-1.5'
                        : 'rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-700'
                    }
                  >
                    <Text
                      className={
                        type === t
                          ? 'font-sans text-xs font-semibold text-white'
                          : 'font-sans text-xs text-zinc-600 dark:text-zinc-300'
                      }
                    >
                      {TYPE_LABELS[t]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={balance}
                onChangeText={setBalance}
                placeholder="Saldo awal (opsional)"
                placeholderTextColor="#a1a1aa"
                keyboardType="numeric"
                className="rounded-xl bg-zinc-100 px-4 py-3 font-sans text-sm text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
              />

              <View className="flex-row gap-2">
                {PALETTE.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={{
                      backgroundColor: c,
                      borderWidth: color === c ? 2 : 0,
                      borderColor: '#fff',
                    }}
                    className="h-7 w-7 rounded-full"
                    accessibilityLabel={`Warna ${c}`}
                  />
                ))}
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={resetForm}
                  className="flex-1 items-center rounded-xl bg-zinc-100 py-3 dark:bg-zinc-700"
                >
                  <Text className="font-sans text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    Batal
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onSave}
                  disabled={!name.trim() || create.isPending}
                  className="flex-1 items-center rounded-xl bg-primary-600 py-3 disabled:opacity-50"
                >
                  <Text className="font-sans text-sm font-semibold text-white">
                    {create.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Text>
                </Pressable>
              </View>
            </NoteCard>
          )}

          {walletList.length === 0 && !showForm ? (
            <View className="items-center py-16">
              <Text className="font-sans text-sm text-zinc-400">Belum ada wallet</Text>
              <Text className="mt-1 font-sans text-xs text-zinc-400">
                Tap + di atas untuk tambah
              </Text>
            </View>
          ) : (
            walletList.map((w) => (
              <NoteCard key={w.id} className="flex-row items-center gap-3 p-4">
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: w.color ?? '#6366f1' }}
                >
                  <Text className="font-display text-sm font-bold text-white">
                    {(w.name[0] ?? 'W').toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {w.name}
                  </Text>
                  <View className="mt-0.5 flex-row items-center gap-2">
                    <View className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">
                      <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
                        {TYPE_LABELS[w.type as WalletType] ?? w.type}
                      </Text>
                    </View>
                    <Text className="font-sans text-xs text-zinc-400">
                      {formatRupiah(w.initialBalance)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => onArchive(w.id, w.name)}
                  className="h-9 w-9 items-center justify-center rounded-full active:opacity-60"
                  accessibilityLabel={`Hapus ${w.name}`}
                >
                  <Trash2 size={16} color="#ef4444" />
                </Pressable>
              </NoteCard>
            ))
          )}
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}
