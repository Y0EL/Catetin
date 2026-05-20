import { useInfiniteQuery } from '@tanstack/react-query'
import type { TransactionDto } from '@catetin/types'
import { apiFetch } from '~/lib/api'

export type TransactionFilters = {
  category?: string
  wallet?: string
  q?: string
  from?: string
  to?: string
}

type Page = { ok: true; transactions: TransactionDto[]; nextCursor: string | null }

export function useTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['transactions', filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (filters.category) params.set('category', filters.category)
      if (filters.wallet) params.set('wallet', filters.wallet)
      if (filters.q) params.set('q', filters.q)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      if (pageParam) params.set('cursor', pageParam)
      const qs = params.toString()
      return apiFetch<Page>(`/v1/transactions${qs ? `?${qs}` : ''}`)
    },
    getNextPageParam: (last) => last.nextCursor,
  })
}
