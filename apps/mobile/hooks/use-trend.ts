import { useQuery } from '@tanstack/react-query'
import type { FlexTrendItem } from '@catetin/types'
import { apiFetch } from '~/lib/api'

export type TrendPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export function useFlexTrend(period: TrendPeriod, from: string, to: string) {
  return useQuery({
    queryKey: ['flex-trend', period, from, to],
    enabled: !!from && !!to,
    queryFn: async () => {
      const res = await apiFetch<{ ok: true; trend: FlexTrendItem[] }>(
        `/v1/reports/trend?period=${period}&from=${from}&to=${to}`,
      )
      return res.trend
    },
  })
}
