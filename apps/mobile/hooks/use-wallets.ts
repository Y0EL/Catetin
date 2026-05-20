import { useQuery } from '@tanstack/react-query'
import type { Wallet } from '@catetin/types'
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
