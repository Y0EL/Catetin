import { useQuery } from '@tanstack/react-query'
import type { TrendItem } from '@catetin/types'
import { apiFetch } from '~/lib/api'

export function useTrend(months = 6) {
  return useQuery({
    queryKey: ['trend', months],
    queryFn: async () => {
      const res = await apiFetch<{ ok: true; trend: TrendItem[] }>(
        `/v1/reports/trend?months=${months}`,
      )
      return res.trend
    },
  })
}
