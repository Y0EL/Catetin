import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateWalletInput, Wallet } from '@catetin/types'
import { apiFetch } from '~/lib/api'

export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: true; wallets: Wallet[] }>('/v1/wallets')
      return res.wallets
    },
  })
}

export function useCreateWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateWalletInput) => {
      const res = await apiFetch<{ ok: true; wallet: Wallet }>('/v1/wallets', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return res.wallet
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallets'] }),
  })
}

export function useArchiveWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: true }>(`/v1/wallets/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallets'] }),
  })
}
