import { useRouter } from 'expo-router'
import { ChevronLeft, Plus, Target, Trash2 } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { formatRupiah } from '@catetin/chat-core'
import type { BudgetWithStatus, Category } from '@catetin/types'
import { useBudgets, useCreateBudget, useDeleteBudget, useUpdateBudget } from '~/hooks/use-budgets'
import { useCategories } from '~/hooks/use-categories'
import { apiErrorMessage } from '~/lib/api'
import { useT } from '~/lib/lang-context'

type EditingState = { mode: 'new' } | { mode: 'edit'; budget: BudgetWithStatus } | null

function formatRupiahInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 13)
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseDigits(formatted: string): number {
  const digits = formatted.replace(/[^0-9]/g, '')
  if (!digits) return 0
  return Number.parseInt(digits, 10)
}

function progressColor(ratio: number, threshold: number): string {
  if (ratio >= 1) return '#dc2626'
  if (ratio * 100 >= threshold) return '#f59e0b'
  return '#16a34a'
}

function todayUtcDate(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10)
}

export default function BudgetsScreen() {
  const router = useRouter()
  const t = useT()
  const budgetsQuery = useBudgets()
  const categoriesQuery = useCategories()
  const [editing, setEditing] = useState<EditingState>(null)

  const items = budgetsQuery.data ?? []

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-4 pt-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common_back')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/settings'))}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70 dark:bg-zinc-800"
        >
          <ChevronLeft size={20} color="#71717a" />
        </Pressable>
        <Text className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {t('budgets_title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('budgets_add')}
          onPress={() => setEditing({ mode: 'new' })}
          className="h-10 w-10 items-center justify-center rounded-full bg-primary-600 active:opacity-90"
        >
          <Plus size={18} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6 gap-3"
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 && !budgetsQuery.isLoading ? (
          <View className="items-center rounded-card bg-white p-8 dark:bg-zinc-900">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <Target size={26} color="#4f46e5" />
            </View>
            <Text className="mt-4 font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {t('budgets_empty_title')}
            </Text>
            <Text className="mt-1 text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
              {t('budgets_empty_body')}
            </Text>
          </View>
        ) : (
          items.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onPress={() => setEditing({ mode: 'edit', budget: b })}
            />
          ))
        )}
      </ScrollView>

      <BudgetEditor
        state={editing}
        categories={categoriesQuery.data ?? []}
        onClose={() => setEditing(null)}
      />
    </SafeAreaView>
  )
}

function BudgetCard({ budget, onPress }: { budget: BudgetWithStatus; onPress: () => void }) {
  const t = useT()
  const ratio = budget.amount > 0 ? budget.spent / budget.amount : 0
  const pct = Math.min(100, Math.round(ratio * 100))
  const color = progressColor(ratio, budget.alertThreshold)
  const remaining = Math.max(0, budget.amount - budget.spent)
  const periodLabel = budget.period === 'monthly' ? t('budgets_monthly') : t('budgets_weekly')

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="rounded-card bg-white p-4 active:opacity-90 dark:bg-zinc-900"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-base font-bold capitalize text-zinc-900 dark:text-zinc-100">
          {budget.categoryName}
        </Text>
        <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {periodLabel}
        </Text>
      </View>
      <View className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <View style={{ width: `${pct}%`, backgroundColor: color, height: '100%' }} />
      </View>
      <View className="mt-2.5 flex-row items-end justify-between">
        <Text className="font-sans text-sm text-zinc-600 dark:text-zinc-300">
          {t('budgets_used_of', {
            spent: formatRupiah(budget.spent),
            total: formatRupiah(budget.amount),
          })}
        </Text>
        <Text className="font-sans text-xs font-semibold" style={{ color }}>
          {pct}%
        </Text>
      </View>
      <Text className="mt-1 font-sans text-xs text-zinc-500 dark:text-zinc-400">
        {t('budgets_remaining', { amount: formatRupiah(remaining) })}
      </Text>
    </Pressable>
  )
}

function BudgetEditor({
  state,
  categories,
  onClose,
}: {
  state: EditingState
  categories: Category[]
  onClose: () => void
}) {
  const create = useCreateBudget()
  const update = useUpdateBudget()
  const del = useDeleteBudget()
  const t = useT()

  const isEdit = state?.mode === 'edit'
  const expenseCats = useMemo(() => categories.filter((c) => c.kind === 'expense'), [categories])

  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly')
  const [amountText, setAmountText] = useState('')
  const [threshold, setThreshold] = useState('80')

  useEffect(() => {
    if (state?.mode === 'edit') {
      setCategoryId(state.budget.categoryId)
      setPeriod(state.budget.period)
      setAmountText(formatRupiahInput(String(state.budget.amount)))
      setThreshold(String(state.budget.alertThreshold))
    } else if (state?.mode === 'new') {
      setCategoryId(expenseCats[0]?.id ?? null)
      setPeriod('monthly')
      setAmountText('')
      setThreshold('80')
    }
  }, [state, expenseCats])

  const amount = parseDigits(amountText)
  const thresholdNum = Math.max(1, Math.min(100, Number.parseInt(threshold || '80', 10) || 80))
  const visible = state !== null

  function onSave() {
    if (!categoryId) {
      Alert.alert(t('budgets_no_category_title'), t('budgets_no_category_body'))
      return
    }
    if (amount <= 0) {
      Alert.alert(t('budgets_no_amount_title'), t('budgets_no_amount_body'))
      return
    }
    if (state?.mode === 'edit') {
      update.mutate(
        {
          id: state.budget.id,
          input: { amount, alertThreshold: thresholdNum, period },
        },
        {
          onSuccess: onClose,
          onError: (err) => Alert.alert(t('budgets_update_failed'), apiErrorMessage(err)),
        },
      )
    } else {
      create.mutate(
        {
          categoryId,
          amount,
          alertThreshold: thresholdNum,
          period,
          startsAt: todayUtcDate(),
        },
        {
          onSuccess: onClose,
          onError: (err) => Alert.alert(t('budgets_save_failed'), apiErrorMessage(err)),
        },
      )
    }
  }

  function onDelete() {
    if (state?.mode !== 'edit') return
    const id = state.budget.id
    Alert.alert(t('budgets_delete_title'), t('budgets_delete_body'), [
      { text: t('common_cancel'), style: 'cancel' },
      {
        text: t('common_delete'),
        style: 'destructive',
        onPress: () =>
          del.mutate(id, {
            onSuccess: onClose,
            onError: (err) => Alert.alert(t('budgets_delete_failed'), apiErrorMessage(err)),
          }),
      },
    ])
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="rounded-t-3xl bg-white p-5 dark:bg-zinc-900">
          <View className="items-center pb-2">
            <View className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </View>
          <Text className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {isEdit ? t('budgets_edit_title') : t('budgets_new_title')}
          </Text>

          <Text className="mt-4 font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {t('common_category')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pt-2"
          >
            {expenseCats.map((c) => {
              const active = c.id === categoryId
              return (
                <Pressable
                  key={c.id}
                  onPress={() => !isEdit && setCategoryId(c.id)}
                  disabled={isEdit}
                  className={
                    active
                      ? 'rounded-full bg-zinc-900 px-4 py-2 dark:bg-zinc-100'
                      : 'rounded-full bg-zinc-100 px-4 py-2 dark:bg-zinc-800'
                  }
                >
                  <Text
                    className={
                      active
                        ? 'font-sans text-xs font-semibold capitalize text-white dark:text-zinc-900'
                        : 'font-sans text-xs font-medium capitalize text-zinc-700 dark:text-zinc-200'
                    }
                  >
                    {c.name}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <Text className="mt-4 font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {t('budgets_period')}
          </Text>
          <View className="mt-2 flex-row gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
            {(['monthly', 'weekly'] as const).map((p) => {
              const active = period === p
              return (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  className={
                    active
                      ? 'flex-1 items-center rounded-full bg-primary-600 py-2.5'
                      : 'flex-1 items-center rounded-full py-2.5 active:opacity-60'
                  }
                >
                  <Text
                    className={
                      active
                        ? 'font-sans text-xs font-semibold text-white'
                        : 'font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
                    }
                  >
                    {p === 'monthly' ? t('budgets_monthly') : t('budgets_weekly')}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Text className="mt-4 font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {t('budgets_amount_label')}
          </Text>
          <View className="mt-2 flex-row items-center gap-2 rounded-card bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
            <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">Rp</Text>
            <TextInput
              value={amountText}
              onChangeText={(t) => setAmountText(formatRupiahInput(t))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#a1a1aa"
              className="flex-1 font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100"
              style={{ fontVariant: ['tabular-nums'] }}
            />
          </View>

          <Text className="mt-4 font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {t('budgets_alert_threshold')}
          </Text>
          <View className="mt-2 flex-row items-center gap-2 rounded-card bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
            <TextInput
              value={threshold}
              onChangeText={(t) => setThreshold(t.replace(/[^0-9]/g, '').slice(0, 3))}
              keyboardType="numeric"
              placeholder="80"
              placeholderTextColor="#a1a1aa"
              className="flex-1 font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100"
            />
            <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">%</Text>
          </View>

          <View className="mt-5 gap-2">
            <Pressable
              onPress={onSave}
              disabled={create.isPending || update.isPending}
              className="items-center rounded-full bg-primary-600 py-3.5 active:opacity-90 disabled:opacity-50"
            >
              <Text className="font-sans text-sm font-semibold text-white">
                {isEdit ? t('budgets_save_changes') : t('budgets_save_new')}
              </Text>
            </Pressable>
            {isEdit ? (
              <Pressable
                onPress={onDelete}
                disabled={del.isPending}
                className="flex-row items-center justify-center gap-1.5 rounded-full bg-danger/10 py-3.5 active:opacity-70"
              >
                <Trash2 size={16} color="#dc2626" />
                <Text className="font-sans text-sm font-semibold text-danger">
                  {t('budgets_delete')}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onClose}
              className="items-center rounded-full bg-zinc-100 py-3.5 active:opacity-70 dark:bg-zinc-800"
            >
              <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t('common_cancel')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
