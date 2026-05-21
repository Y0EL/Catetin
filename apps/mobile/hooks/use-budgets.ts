import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BudgetWithStatus, CreateBudgetInput, UpdateBudgetInput } from '@catetin/types'
import { apiFetch } from '~/lib/api'

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: true; budgets: BudgetWithStatus[] }>('/v1/budgets')
      return res.budgets
    },
  })
}

export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBudgetInput) => {
      const res = await apiFetch<{ ok: true; budget: { id: string } }>('/v1/budgets', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return res.budget
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}

export function useUpdateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateBudgetInput }) => {
      const res = await apiFetch<{ ok: true; budget: { id: string } }>(`/v1/budgets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
      return res.budget
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch<{ ok: true }>(`/v1/budgets/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}
