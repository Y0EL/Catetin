import { useQuery } from '@tanstack/react-query'
import type { MonthSummary } from '@catetin/types'
import { apiFetch } from '~/lib/api'

export function currentMonth(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function useSummary(month: string) {
  return useQuery({
    queryKey: ['summary', month],
    queryFn: async () => {
      const res = await apiFetch<{ ok: true; summary: MonthSummary }>(
        `/v1/reports/summary?month=${month}`,
      )
      return res.summary
    },
  })
}
