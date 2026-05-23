import { formatRupiah } from '@catetin/chat-core'
import { ChevronLeft, ChevronRight, FileText, Sheet } from 'lucide-react-native'
import { useState } from 'react'
import { useIsDark } from '~/lib/use-accent-color'
import { Alert, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DonutChart } from '~/components/donut-chart'
import { LineChart } from '~/components/line-chart'
import { Money } from '~/components/money'
import { NoteCard } from '~/components/note-card'
import { ScreenFade } from '~/components/screen-fade'
import { useBudgets } from '~/hooks/use-budgets'
import { currentMonth, useSummary } from '~/hooks/use-summary'
import { useFlexTrend, type TrendPeriod } from '~/hooks/use-trend'
import { downloadAndShareReport } from '~/hooks/use-download-report'
import { useAccentColor } from '~/lib/use-accent-color'
import { getCategoryMeta, type CategoryKey } from '~/lib/categories'
import { useLang, useT } from '~/lib/lang-context'
import { MONTHS_SHORT } from '~/lib/translations'
import { useRouter } from 'expo-router'

function getRange(period: TrendPeriod, anchor: string): { from: string; to: string } {
  if (period === 'daily' || period === 'weekly') {
    const parts = anchor.split('-').map(Number)
    const y = parts[0] ?? 2025
    const m = parts[1] ?? 1
    const lastDay = new Date(y, m, 0).getDate()
    return { from: `${anchor}-01`, to: `${anchor}-${String(lastDay).padStart(2, '0')}` }
  }
  if (period === 'monthly') {
    const parts = anchor.split('-').map(Number)
    const y = parts[0] ?? 2025
    const m = parts[1] ?? 1
    const lastDay = new Date(y, m, 0).getDate()
    const fd = new Date(y, m - 7, 1)
    const fy = fd.getFullYear()
    const fm = fd.getMonth() + 1
    return {
      from: `${fy}-${String(fm).padStart(2, '0')}-01`,
      to: `${anchor}-${String(lastDay).padStart(2, '0')}`,
    }
  }
  return { from: `${anchor}-01-01`, to: `${anchor}-12-31` }
}

function getNavLabel(period: TrendPeriod, anchor: string, monthAbbr: string[]): string {
  if (period === 'yearly') return anchor
  if (period === 'monthly') {
    const { from, to } = getRange(period, anchor)
    const fp = from.split('-').map(Number)
    const tp = to.split('-').map(Number)
    const fromLabel = `${monthAbbr[(fp[1] ?? 1) - 1]} ${fp[0]}`
    const toLabel = `${monthAbbr[(tp[1] ?? 1) - 1]} ${tp[0]}`
    return `${fromLabel} - ${toLabel}`
  }
  const parts = anchor.split('-').map(Number)
  const y = parts[0] ?? 2025
  const m = parts[1] ?? 1
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

function navigate(period: TrendPeriod, anchor: string, dir: -1 | 1): string {
  if (period === 'yearly') return String(parseInt(anchor, 10) + dir)
  const parts = anchor.split('-').map(Number)
  const y = parts[0] ?? 2025
  const m = parts[1] ?? 1
  const step = period === 'monthly' ? 6 : 1
  const d = new Date(y, m - 1 + dir * step, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function isAtLatest(period: TrendPeriod, anchor: string): boolean {
  const cm = currentMonth()
  if (period === 'yearly') return anchor >= cm.slice(0, 4)
  if (period === 'monthly') {
    const next = navigate(period, anchor, 1)
    return next > cm
  }
  return anchor >= cm
}

function anchorToMonth(period: TrendPeriod, anchor: string): string {
  if (period === 'yearly') return `${anchor}-${currentMonth().slice(5)}`
  return anchor
}

export default function AnalyticsScreen() {
  const router = useRouter()
  const accent = useAccentColor()
  const { width } = useWindowDimensions()
  const chartWidth = Math.max(0, width - 64)
  const t = useT()
  const { lang } = useLang()
  const monthAbbr = MONTHS_SHORT[lang]

  const PERIODS: { key: TrendPeriod; label: string }[] = [
    { key: 'daily', label: t('analytics_period_day') },
    { key: 'weekly', label: t('analytics_period_week') },
    { key: 'monthly', label: t('analytics_period_month') },
    { key: 'yearly', label: t('analytics_period_year') },
  ]

  const isDark = useIsDark()
  const [period, setPeriod] = useState<TrendPeriod>('monthly')
  const [anchor, setAnchor] = useState<string>(currentMonth())

  const summaryMonth = anchorToMonth(period, anchor)
  const { from, to } = getRange(period, anchor)

  const summary = useSummary(summaryMonth)
  const trend = useFlexTrend(period, from, to)
  const budgets = useBudgets()

  const income = summary.data?.income ?? 0
  const expense = summary.data?.expense ?? 0
  const net = income - expense

  function switchPeriod(p: TrendPeriod) {
    if (p === period) return
    if (p === 'yearly') {
      setAnchor(anchor.slice(0, 4))
    } else if (period === 'yearly') {
      const cm = currentMonth()
      setAnchor(anchor === cm.slice(0, 4) ? cm : `${anchor}-12`)
    }
    setPeriod(p)
  }

  async function exportPdf() {
    try {
      await downloadAndShareReport('pdf', summaryMonth)
    } catch {
      Alert.alert(t('common_error'), t('analytics_pdf_failed'))
    }
  }

  async function exportCsv() {
    try {
      await downloadAndShareReport('csv', summaryMonth)
    } catch {
      Alert.alert(t('common_error'), t('analytics_csv_failed'))
    }
  }

  const donutSlices = (summary.data?.byCategory ?? []).slice(0, 7).map((c) => ({
    name: c.name,
    total: c.total,
    color: getCategoryMeta(c.name as CategoryKey).tint,
  }))

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        {/* Header */}
        <View className="flex-row items-center justify-between px-2 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
            accessibilityLabel={t('common_back')}
          >
            <ChevronLeft size={24} color={accent} />
          </Pressable>
          <Text className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t('analytics_title')}
          </Text>
          <View className="flex-row gap-1 pr-2">
            <Pressable
              onPress={exportPdf}
              className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 active:opacity-70 dark:bg-zinc-800"
              accessibilityLabel={t('analytics_dl_pdf')}
            >
              <FileText size={17} color={accent} />
            </Pressable>
            <Pressable
              onPress={exportCsv}
              className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 active:opacity-70 dark:bg-zinc-800"
              accessibilityLabel={t('analytics_dl_csv')}
            >
              <Sheet size={17} color={accent} />
            </Pressable>
          </View>
        </View>

        {/* Period selector */}
        <View className="flex-row items-center gap-2 px-4 py-3">
          {PERIODS.map((p) => {
            const active = period === p.key
            return (
              <Pressable
                key={p.key}
                onPress={() => switchPeriod(p.key)}
                className="flex-1 items-center rounded-full py-1.5 active:opacity-70"
                style={{ backgroundColor: active ? accent : 'transparent' }}
              >
                <Text
                  className={
                    active
                      ? isDark
                        ? 'font-sans text-sm font-semibold text-zinc-900'
                        : 'font-sans text-sm font-semibold text-white'
                      : 'font-sans text-sm font-medium text-zinc-500 dark:text-zinc-400'
                  }
                >
                  {p.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Date navigator */}
        <View className="flex-row items-center justify-center gap-4 pb-2">
          <Pressable
            onPress={() => setAnchor(navigate(period, anchor, -1))}
            className="h-9 w-9 items-center justify-center rounded-full active:opacity-60"
          >
            <ChevronLeft size={20} color={accent} />
          </Pressable>
          <Text className="w-48 text-center font-sans text-sm font-semibold capitalize text-zinc-700 dark:text-zinc-200">
            {getNavLabel(period, anchor, monthAbbr)}
          </Text>
          <Pressable
            onPress={() => setAnchor(navigate(period, anchor, 1))}
            disabled={isAtLatest(period, anchor)}
            className="h-9 w-9 items-center justify-center rounded-full active:opacity-60 disabled:opacity-30"
          >
            <ChevronRight size={20} color={accent} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-32 pt-4 gap-5"
          showsVerticalScrollIndicator={false}
        >
          {/* Summary card */}
          <NoteCard className="p-5">
            <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {t('analytics_net')}
            </Text>
            <View className="mt-1">
              <Money value={net} size="hero" tone={net >= 0 ? 'income' : 'expense'} compact />
            </View>
            <View className="mt-4 flex-row items-stretch">
              <View className="flex-1">
                <Text className="font-sans text-xs text-zinc-400 dark:text-zinc-500">
                  {t('common_income')}
                </Text>
                <View className="mt-1">
                  <Money value={income} size="lg" tone="income" compact />
                </View>
              </View>
              <View className="mx-4 w-px bg-zinc-100 dark:bg-zinc-700" />
              <View className="flex-1">
                <Text className="font-sans text-xs text-zinc-400 dark:text-zinc-500">
                  {t('common_expense')}
                </Text>
                <View className="mt-1">
                  <Money value={expense} size="lg" tone="expense" compact />
                </View>
              </View>
            </View>
          </NoteCard>

          {/* Trend line chart */}
          <NoteCard className="p-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t('analytics_trend')}
              </Text>
              <View className="flex-row gap-4">
                <View className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full bg-success" />
                  <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
                    {t('analytics_trend_in')}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full bg-danger" />
                  <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
                    {t('analytics_trend_out')}
                  </Text>
                </View>
              </View>
            </View>
            <View className="mt-3">
              <LineChart data={trend.data ?? []} width={chartWidth} period={period} />
            </View>
          </NoteCard>

          {/* Category breakdown with donut */}
          {donutSlices.length > 0 ? (
            <NoteCard className="p-4">
              <Text className="mb-3 font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t('analytics_by_category')}
              </Text>
              <View className="flex-row items-center gap-4">
                <DonutChart slices={donutSlices} total={expense} />
                <View className="flex-1 gap-2">
                  {donutSlices.map((s) => {
                    const pct = expense > 0 ? Math.round((s.total / expense) * 100) : 0
                    return (
                      <View key={s.name} className="flex-row items-center gap-2">
                        <View
                          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <View className="flex-1">
                          <Text
                            className="font-sans text-xs capitalize text-zinc-700 dark:text-zinc-200"
                            numberOfLines={1}
                          >
                            {s.name}
                          </Text>
                          <Text className="font-sans text-[10px] text-zinc-400">{pct}%</Text>
                        </View>
                        <Text className="font-sans text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                          {formatRupiah(s.total)}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            </NoteCard>
          ) : null}

          {/* Budget */}
          {budgets.data && budgets.data.length > 0 ? (
            <NoteCard className="p-4">
              <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t('analytics_budget_month')}
              </Text>
              <View className="mt-3 gap-4">
                {budgets.data.map((b) => {
                  const pct =
                    b.amount > 0 ? Math.min(100, Math.round((b.spent / b.amount) * 100)) : 0
                  const over = b.spent > b.amount
                  const alertPct = !over && pct >= b.alertThreshold
                  const barColor = over ? '#ef4444' : alertPct ? '#f59e0b' : accent
                  return (
                    <View key={b.id}>
                      <View className="flex-row items-center justify-between">
                        <Text className="font-sans text-sm capitalize text-zinc-700 dark:text-zinc-200">
                          {b.categoryName}
                        </Text>
                        <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
                          {formatRupiah(b.spent)} / {formatRupiah(b.amount)}
                        </Text>
                      </View>
                      <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
                        <View
                          style={{ width: `${pct}%`, backgroundColor: barColor, height: '100%' }}
                        />
                      </View>
                      <Text className="mt-0.5 font-sans text-xs text-zinc-400 dark:text-zinc-500">
                        {t('analytics_pct_used', { pct })}
                        {over
                          ? `, ${t('analytics_over_budget')}`
                          : alertPct
                            ? `, ${t('analytics_almost_full')}`
                            : ''}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </NoteCard>
          ) : null}
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}
