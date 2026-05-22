import { formatRupiah } from '@catetin/chat-core'
import { ChevronLeft, ChevronRight, FileText, Sheet } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CategoryBreakdown } from '~/components/category-breakdown'
import { Money } from '~/components/money'
import { NoteCard } from '~/components/note-card'
import { ScreenFade } from '~/components/screen-fade'
import { TrendChart } from '~/components/trend-chart'
import { useBudgets } from '~/hooks/use-budgets'
import { currentMonth, useSummary } from '~/hooks/use-summary'
import { useTrend } from '~/hooks/use-trend'
import { downloadAndShareReport } from '~/hooks/use-download-report'
import { useAccentColor } from '~/lib/use-accent-color'
import { useRouter } from 'expo-router'

function prevMonth(m: string): string {
  const parts = m.split('-').map(Number)
  const y = parts[0] ?? 2025
  const mo = parts[1] ?? 1
  const d = new Date(y, mo - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(m: string): string {
  const parts = m.split('-').map(Number)
  const y = parts[0] ?? 2025
  const mo = parts[1] ?? 1
  const d = new Date(y, mo, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(m: string): string {
  const parts = m.split('-').map(Number)
  const y = parts[0] ?? 2025
  const mo = parts[1] ?? 1
  return new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export default function AnalyticsScreen() {
  const router = useRouter()
  const accent = useAccentColor()
  const { width } = useWindowDimensions()
  const chartWidth = Math.max(0, width - 64)

  const [month, setMonth] = useState(currentMonth())
  const isCurrentMonth = month === currentMonth()

  const summary = useSummary(month)
  const trend = useTrend(6)
  const budgets = useBudgets()

  const income = summary.data?.income ?? 0
  const expense = summary.data?.expense ?? 0
  const net = income - expense

  async function exportPdf() {
    try {
      await downloadAndShareReport('pdf', month)
    } catch {
      Alert.alert('Gagal', 'PDF gagal dibuat.')
    }
  }

  async function exportCsv() {
    try {
      await downloadAndShareReport('csv', month)
    } catch {
      Alert.alert('Gagal', 'CSV gagal diekspor.')
    }
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
            Analitik
          </Text>
          <View className="flex-row gap-1 pr-2">
            <Pressable
              onPress={exportPdf}
              className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 active:opacity-70 dark:bg-zinc-800"
              accessibilityLabel="Unduh PDF"
            >
              <FileText size={17} color={accent} />
            </Pressable>
            <Pressable
              onPress={exportCsv}
              className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 active:opacity-70 dark:bg-zinc-800"
              accessibilityLabel="Unduh CSV"
            >
              <Sheet size={17} color={accent} />
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center justify-center gap-5 py-3">
          <Pressable
            onPress={() => setMonth(prevMonth(month))}
            className="h-9 w-9 items-center justify-center rounded-full active:opacity-60"
          >
            <ChevronLeft size={20} color={accent} />
          </Pressable>
          <Text className="w-36 text-center font-sans text-sm font-semibold capitalize text-zinc-700 dark:text-zinc-200">
            {monthLabel(month)}
          </Text>
          <Pressable
            onPress={() => setMonth(nextMonth(month))}
            disabled={isCurrentMonth}
            className="h-9 w-9 items-center justify-center rounded-full active:opacity-60 disabled:opacity-30"
          >
            <ChevronRight size={20} color={accent} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-32 gap-3"
          showsVerticalScrollIndicator={false}
        >
          <NoteCard className="p-5">
            <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Net
            </Text>
            <View className="mt-1">
              <Money value={net} size="hero" tone={net >= 0 ? 'income' : 'expense'} compact />
            </View>
            <View className="mt-4 flex-row items-stretch">
              <View className="flex-1">
                <Text className="font-sans text-xs text-zinc-400 dark:text-zinc-500">
                  Pemasukan
                </Text>
                <View className="mt-1">
                  <Money value={income} size="lg" compact />
                </View>
              </View>
              <View className="mx-4 w-px bg-zinc-100 dark:bg-zinc-700" />
              <View className="flex-1">
                <Text className="font-sans text-xs text-zinc-400 dark:text-zinc-500">
                  Pengeluaran
                </Text>
                <View className="mt-1">
                  <Money value={expense} size="lg" compact />
                </View>
              </View>
            </View>
          </NoteCard>

          <NoteCard className="p-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Trend 6 bulan
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full bg-success" />
                  <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
                    Pemasukan
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full bg-danger" />
                  <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
                    Pengeluaran
                  </Text>
                </View>
              </View>
            </View>
            <View className="mt-3">
              <TrendChart data={trend.data ?? []} width={chartWidth} />
            </View>
          </NoteCard>

          {summary.data && summary.data.byCategory.length > 0 ? (
            <NoteCard className="p-4">
              <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Pengeluaran per kategori
              </Text>
              <View className="mt-3">
                <CategoryBreakdown slices={summary.data.byCategory} max={10} />
              </View>
            </NoteCard>
          ) : null}

          {budgets.data && budgets.data.length > 0 ? (
            <NoteCard className="p-4">
              <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Budget bulan ini
              </Text>
              <View className="mt-3 gap-4">
                {budgets.data.map((b) => {
                  const pct =
                    b.amount > 0 ? Math.min(100, Math.round((b.spent / b.amount) * 100)) : 0
                  const over = b.spent > b.amount
                  const alert = !over && pct >= b.alertThreshold
                  const barColor = over ? '#ef4444' : alert ? '#f59e0b' : '#4f46e5'
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
                        {pct}% terpakai
                        {over ? ', melebihi budget' : alert ? ', mendekati batas' : ''}
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
