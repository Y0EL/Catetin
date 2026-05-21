import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Images,
  Skull,
  Sparkles,
  X,
} from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { formatRupiah, parseQuickAddText } from '@catetin/chat-core'
import type { OcrReceiptResponse } from '@catetin/types'
import { LoadingLottie } from '~/components/loading-lottie'
import { useCategories } from '~/hooks/use-categories'
import { useCreateTransaction } from '~/hooks/use-create-transaction'
import { useOcrReceipt } from '~/hooks/use-ocr-receipt'
import { useUpdateTransaction } from '~/hooks/use-transactions'
import { useWallets } from '~/hooks/use-wallets'
import { apiErrorMessage } from '~/lib/api'
import { getCategoryMeta, type CategoryKey } from '~/lib/categories'
import { useEditStore } from '~/lib/edit-store'

const MAX_AMOUNT_DIGITS = 13
const BIG_AMOUNT_THRESHOLD = 1_000_000_000

function formatRupiahInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, MAX_AMOUNT_DIGITS)
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function amountFontSize(formatted: string): number {
  const n = formatted.replace(/[^0-9]/g, '').length
  if (n <= 6) return 48
  if (n <= 9) return 38
  if (n <= 11) return 30
  return 22
}

function parseDigits(formatted: string): number {
  const digits = formatted.replace(/[^0-9]/g, '')
  if (!digits) return 0
  return Number.parseInt(digits, 10)
}

function titleCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function AddModal() {
  const router = useRouter()
  const wallets = useWallets()
  const categories = useCategories()
  const createTx = useCreateTransaction()
  const updateTx = useUpdateTransaction()
  const ocr = useOcrReceipt()
  const editing = useEditStore((s) => s.editing)
  const setEditing = useEditStore((s) => s.setEditing)
  const isEditing = editing !== null

  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const [amountText, setAmountText] = useState('')
  const [walletId, setWalletId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [showBigConfirm, setShowBigConfirm] = useState(false)
  const [draftPreview, setDraftPreview] = useState<OcrReceiptResponse | null>(null)
  const params = useLocalSearchParams<{ scan?: string }>()
  const scanTriggered = useRef(false)

  const amount = useMemo(() => parseDigits(amountText), [amountText])
  const walletList = wallets.data ?? []
  const catList = useMemo(
    () => (categories.data ?? []).filter((c) => c.kind === kind),
    [categories.data, kind],
  )

  const effectiveWalletId = walletId ?? walletList[0]?.id ?? null
  const effectiveCategoryId =
    categoryId && catList.some((c) => c.id === categoryId) ? categoryId : (catList[0]?.id ?? null)

  function close() {
    setEditing(null)
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/index')
  }

  function applyTextHint(text: string) {
    setDescription(text)
    const parsed = parseQuickAddText(text)
    if (!parsed) return
    setAmountText(formatRupiahInput(String(parsed.amount)))
    setKind('expense')
    const match = (categories.data ?? []).find((c) => c.name === parsed.category)
    if (match) setCategoryId(match.id)
  }

  function applyDraft(draft: OcrReceiptResponse) {
    setKind('expense')
    if (draft.total > 0) setAmountText(formatRupiahInput(String(draft.total)))
    if (draft.merchant) setDescription(draft.merchant)
    const catName = draft.items[0]?.category
    if (catName) {
      const match = (categories.data ?? []).find((c) => c.name === catName && c.kind === 'expense')
      if (match) setCategoryId(match.id)
    }
  }

  async function scanReceipt(useCamera: boolean) {
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync()
        if (!perm.granted) {
          Alert.alert('Izin kamera', 'Catetin butuh akses kamera buat scan struk.')
          return
        }
      }
      const picker = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync
      const result = await picker({ mediaTypes: ['images'], quality: 0.6, base64: true })
      if (result.canceled) return
      const asset = result.assets[0]
      const base64 = asset?.base64
      if (!base64) {
        Alert.alert('Gagal ambil gambar', 'Coba lagi ya.')
        return
      }
      const draft = await ocr.mutateAsync({
        image: base64,
        mimeType: asset.mimeType ?? 'image/jpeg',
      })
      setDraftPreview(draft)
    } catch (err) {
      Alert.alert('Gagal scan struk', apiErrorMessage(err))
    }
  }

  useEffect(() => {
    if (!params.scan || scanTriggered.current) return
    scanTriggered.current = true
    void scanReceipt(params.scan === 'camera')
  }, [params.scan])

  useEffect(() => {
    if (!editing) return
    setKind(editing.kind === 'income' ? 'income' : 'expense')
    setAmountText(formatRupiahInput(String(editing.amount)))
    setWalletId(editing.walletId)
    setCategoryId(editing.categoryId)
    setDescription(editing.description ?? editing.merchant ?? '')
  }, [editing])

  function onSave() {
    if (amount <= 0) {
      Alert.alert('Nominal kosong', 'Isi dulu jumlah duitnya ya.')
      return
    }
    if (!effectiveWalletId || !effectiveCategoryId) {
      Alert.alert('Sebentar ya', 'Wallet atau kategori belum siap. Coba lagi sebentar.')
      return
    }
    if (amount >= BIG_AMOUNT_THRESHOLD) {
      setShowBigConfirm(true)
      return
    }
    doSave()
  }

  function doSave() {
    setShowBigConfirm(false)
    if (!effectiveWalletId || !effectiveCategoryId) return
    if (isEditing && editing) {
      updateTx.mutate(
        {
          id: editing.id,
          input: {
            walletId: effectiveWalletId,
            categoryId: effectiveCategoryId,
            kind,
            amount,
            description: description.trim() ? description.trim() : undefined,
          },
        },
        {
          onSuccess: close,
          onError: (err) => Alert.alert('Gagal update', apiErrorMessage(err)),
        },
      )
      return
    }
    createTx.mutate(
      {
        walletId: effectiveWalletId,
        categoryId: effectiveCategoryId,
        kind,
        amount,
        description: description.trim() ? description.trim() : undefined,
        occurredAt: new Date().toISOString(),
        source: 'mobile',
      },
      {
        onSuccess: close,
        onError: (err) => Alert.alert('Gagal nyimpen', apiErrorMessage(err)),
      },
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top', 'bottom']}>
      <View className="items-center pt-2">
        <View className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
      </View>

      <View className="flex-row items-center justify-between px-4 pt-4">
        <Text className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {isEditing ? 'Edit transaksi' : 'Catat cepat'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup"
          onPress={close}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70 dark:bg-zinc-800"
        >
          <X size={18} color="#71717a" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-40 pt-6 gap-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!isEditing ? (
          <View className="overflow-hidden rounded-card bg-primary-600 p-4">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#ffffff" />
              <Text className="font-display text-sm font-bold text-white">Scan struk pakai AI</Text>
            </View>
            <Text className="mt-1 font-sans text-xs leading-5 text-primary-100">
              Foto struknya, Catetin baca total dan kategorinya otomatis.
            </Text>
            <View className="mt-3 flex-row gap-2">
              <ScanButton
                icon={<Camera size={16} color="#18181b" />}
                label="Kamera"
                onPress={() => scanReceipt(true)}
                disabled={ocr.isPending}
              />
              <ScanButton
                icon={<Images size={16} color="#18181b" />}
                label="Galeri"
                onPress={() => scanReceipt(false)}
                disabled={ocr.isPending}
              />
            </View>
            {ocr.isPending ? (
              <View className="mt-3 flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="font-sans text-xs text-primary-100">Lagi baca struk...</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View className="flex-row gap-2">
          <KindToggle
            active={kind === 'expense'}
            onPress={() => setKind('expense')}
            icon={<ArrowDownLeft size={16} color={kind === 'expense' ? '#ffffff' : '#dc2626'} />}
            label="Keluar"
            activeClass="bg-danger"
          />
          <KindToggle
            active={kind === 'income'}
            onPress={() => setKind('income')}
            icon={<ArrowUpRight size={16} color={kind === 'income' ? '#ffffff' : '#16a34a'} />}
            label="Masuk"
            activeClass="bg-success"
          />
        </View>

        <View className="rounded-3xl bg-primary-600 p-6">
          <Text className="font-sans text-xs font-medium uppercase tracking-widest text-primary-200">
            Jumlah
          </Text>
          <View className="mt-2 flex-row items-baseline gap-2">
            <Text className="font-display text-2xl font-bold text-primary-200">Rp</Text>
            <TextInput
              value={amountText}
              onChangeText={(t) => setAmountText(formatRupiahInput(t))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#71717a"
              numberOfLines={1}
              className="flex-1 font-display font-extrabold text-white"
              style={{
                paddingVertical: 0,
                fontVariant: ['tabular-nums'],
                fontSize: amountFontSize(amountText),
              }}
            />
          </View>
        </View>

        <View>
          <Label>Kategori</Label>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {catList.map((c) => {
              const meta = getCategoryMeta(c.name as CategoryKey)
              const Icon = meta.icon
              const active = c.id === effectiveCategoryId
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Kategori ${c.name}`}
                  className={
                    active
                      ? 'flex-row items-center gap-2 rounded-full bg-primary-600 px-4 py-2.5'
                      : 'flex-row items-center gap-2 rounded-full bg-white px-4 py-2.5 active:opacity-70 dark:bg-zinc-800'
                  }
                >
                  <Icon size={15} color={active ? '#ffffff' : meta.tint} />
                  <Text
                    className={
                      active
                        ? 'font-sans text-sm font-semibold text-white'
                        : 'font-sans text-sm font-medium text-zinc-700 dark:text-zinc-200'
                    }
                  >
                    {titleCase(c.name)}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View>
          <Label>Wallet</Label>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {walletList.map((w) => {
              const active = w.id === effectiveWalletId
              return (
                <Pressable
                  key={w.id}
                  onPress={() => setWalletId(w.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Wallet ${w.name}`}
                  className={
                    active
                      ? 'rounded-full bg-zinc-900 px-5 py-2.5 dark:bg-zinc-100'
                      : 'rounded-full bg-white px-5 py-2.5 active:opacity-70 dark:bg-zinc-800'
                  }
                >
                  <Text
                    className={
                      active
                        ? 'font-sans text-sm font-semibold text-white dark:text-zinc-900'
                        : 'font-sans text-sm font-medium text-zinc-700 dark:text-zinc-200'
                    }
                  >
                    {w.name}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View>
          <Label>Catatan</Label>
          <TextInput
            value={description}
            onChangeText={applyTextHint}
            placeholder='Contoh: "kopi 25rb di starbucks"'
            placeholderTextColor="#a1a1aa"
            className="mt-3 rounded-input bg-white px-4 py-3.5 font-sans text-base text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <Text className="mt-2 font-sans text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Tulis bebas, Catetin coba detect angka dan kategori otomatis.
          </Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-zinc-50 px-4 pb-8 pt-3 dark:border-zinc-800 dark:bg-zinc-950">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isEditing ? 'Simpan perubahan' : 'Catat sekarang'}
          disabled={createTx.isPending || updateTx.isPending}
          onPress={onSave}
          className="items-center rounded-full bg-primary-600 py-4 active:opacity-90 disabled:opacity-50"
        >
          <Text className="font-sans text-base font-semibold text-white">
            {createTx.isPending || updateTx.isPending
              ? 'Nyimpen'
              : isEditing
                ? 'Simpan perubahan'
                : 'Catat sekarang'}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={showBigConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBigConfirm(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-8">
          <View className="w-full rounded-3xl bg-white p-6 dark:bg-zinc-800">
            <View className="h-16 w-16 items-center justify-center self-center rounded-full bg-danger/10">
              <Skull size={30} color="#dc2626" />
            </View>
            <Text className="mt-4 text-center font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Hmm, gede banget cok
            </Text>
            <Text className="mt-2 text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
              Lo beneran mau catat{' '}
              <Text className="font-semibold text-zinc-900 dark:text-zinc-100">
                Rp {amountText}
              </Text>
              ? Itu angka beneran apa kepencet bjir?
            </Text>
            <View className="mt-6 gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={doSave}
                className="items-center rounded-full bg-primary-600 py-3.5 active:opacity-90"
              >
                <Text className="font-sans text-sm font-semibold text-white">Yakin, gas catat</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowBigConfirm(false)}
                className="items-center rounded-full bg-zinc-100 py-3.5 active:opacity-70 dark:bg-zinc-800"
              >
                <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  Eh, ralat dulu
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={ocr.isPending || draftPreview !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDraftPreview(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          {ocr.isPending ? (
            <View className="w-full items-center rounded-3xl bg-white p-6 dark:bg-zinc-900">
              <LoadingLottie size={140} />
              <Text className="mt-2 font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Catetin lagi baca struk lo
              </Text>
              <Text className="mt-1 text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
                Bentar, gue ekstrak total, merchant, sama kategorinya pakai AI.
              </Text>
            </View>
          ) : draftPreview ? (
            <View className="w-full rounded-3xl bg-white p-6 dark:bg-zinc-900">
              <View className="flex-row items-center justify-between">
                <Text className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Hasil scan struk
                </Text>
                <ConfidenceBadge confidence={draftPreview.confidence} />
              </View>

              <View className="mt-5">
                <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Total
                </Text>
                <Text
                  className="mt-1 font-display text-3xl font-extrabold text-zinc-900 dark:text-zinc-100"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatRupiah(draftPreview.total)}
                </Text>
                {draftPreview.total === 0 ? (
                  <Text className="mt-1 font-sans text-xs text-danger">
                    Total gak kebaca. Ralat manual aja.
                  </Text>
                ) : null}
              </View>

              <View className="mt-4 gap-2">
                {draftPreview.merchant ? (
                  <DraftRow label="Merchant" value={draftPreview.merchant} />
                ) : null}
                {draftPreview.date ? <DraftRow label="Tanggal" value={draftPreview.date} /> : null}
                {draftPreview.items[0]?.category ? (
                  <DraftRow label="Kategori" value={titleCase(draftPreview.items[0].category)} />
                ) : null}
              </View>

              {draftPreview.items.length > 0 ? (
                <View className="mt-4 rounded-card bg-zinc-50 p-3 dark:bg-zinc-800">
                  <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Item kebaca
                  </Text>
                  <View className="mt-2 gap-1.5">
                    {draftPreview.items.slice(0, 6).map((it, i) => (
                      <View key={i} className="flex-row justify-between gap-3">
                        <Text
                          className="flex-1 font-sans text-sm text-zinc-700 dark:text-zinc-200"
                          numberOfLines={1}
                        >
                          {it.qty > 1 ? `${it.qty}x ` : ''}
                          {it.name}
                        </Text>
                        <Text className="font-sans text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {formatRupiah(it.price)}
                        </Text>
                      </View>
                    ))}
                    {draftPreview.items.length > 6 ? (
                      <Text className="mt-1 font-sans text-xs text-zinc-500">
                        +{draftPreview.items.length - 6} item lain
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View className="mt-5 gap-2">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    applyDraft(draftPreview)
                    setDraftPreview(null)
                  }}
                  className="items-center rounded-full bg-primary-600 py-3.5 active:opacity-90"
                >
                  <Text className="font-sans text-sm font-semibold text-white">Pakai ini</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDraftPreview(null)}
                  className="items-center rounded-full bg-zinc-100 py-3.5 active:opacity-70 dark:bg-zinc-800"
                >
                  <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    Ralat manual
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function DraftRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="font-sans text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        {label}
      </Text>
      <Text
        className="flex-1 text-right font-sans text-sm font-medium text-zinc-900 dark:text-zinc-100"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  )
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const cfg =
    confidence === 'high'
      ? {
          bg: 'bg-success/15',
          text: 'text-success',
          icon: <CheckCircle2 size={14} color="#16a34a" />,
          label: 'Yakin',
        }
      : confidence === 'low'
        ? {
            bg: 'bg-danger/15',
            text: 'text-danger',
            icon: <AlertCircle size={14} color="#dc2626" />,
            label: 'Ragu',
          }
        : {
            bg: 'bg-warning/15',
            text: 'text-warning',
            icon: <AlertCircle size={14} color="#f59e0b" />,
            label: 'Agak ragu',
          }
  return (
    <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${cfg.bg}`}>
      {cfg.icon}
      <Text className={`font-sans text-xs font-semibold ${cfg.text}`}>{cfg.label}</Text>
    </View>
  )
}

function ScanButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-white py-2.5 active:opacity-80 disabled:opacity-50"
    >
      {icon}
      <Text className="font-sans text-sm font-semibold text-zinc-900">{label}</Text>
    </Pressable>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
      {children}
    </Text>
  )
}

function KindToggle({
  active,
  onPress,
  icon,
  label,
  activeClass,
}: {
  active: boolean
  onPress: () => void
  icon: React.ReactNode
  label: string
  activeClass: string
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : {}}
      className={
        active
          ? `flex-1 flex-row items-center justify-center gap-2 rounded-full py-3 ${activeClass}`
          : 'flex-1 flex-row items-center justify-center gap-2 rounded-full bg-white py-3 active:opacity-70 dark:bg-zinc-800'
      }
    >
      {icon}
      <Text
        className={
          active
            ? 'font-sans text-sm font-semibold text-white'
            : 'font-sans text-sm font-medium text-zinc-700 dark:text-zinc-200'
        }
      >
        {label}
      </Text>
    </Pressable>
  )
}
