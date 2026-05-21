import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TransactionDto, UpdateTransactionInput } from '@catetin/types'
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

function invalidateAfterMutation(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['transactions'] })
  qc.invalidateQueries({ queryKey: ['summary'] })
  qc.invalidateQueries({ queryKey: ['budgets'] })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTransactionInput }) => {
      const res = await apiFetch<{ ok: true; transaction: TransactionDto }>(
        `/v1/transactions/${id}`,
        { method: 'PATCH', body: JSON.stringify(input) },
      )
      return res.transaction
    },
    onSuccess: () => invalidateAfterMutation(qc),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch<{ ok: true }>(`/v1/transactions/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => invalidateAfterMutation(qc),
  })
}

export function useBulkDeleteTransactions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiFetch<{ ok: true; deleted: number }>('/v1/transactions/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      })
      return res.deleted
    },
    onSuccess: () => invalidateAfterMutation(qc),
  })
}
