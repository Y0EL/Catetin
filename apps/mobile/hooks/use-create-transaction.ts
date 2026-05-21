import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateTransactionInput, TransactionDto } from '@catetin/types'
import { apiFetch } from '~/lib/api'

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const res = await apiFetch<{ ok: true; transaction: TransactionDto }>('/v1/transactions', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return res.transaction
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['trend'] })
    },
  })
}
