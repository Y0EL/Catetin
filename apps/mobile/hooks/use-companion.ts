import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CompanionQuota, StartCompanionSessionResponse } from '@catetin/types'
import { apiFetch } from '~/lib/api'

export function useCompanionQuota() {
  return useQuery({
    queryKey: ['companion-quota'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: true; quota: CompanionQuota }>('/v1/companion/quota')
      return res.quota
    },
  })
}

export function useStartCompanion() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch<{ ok: true } & StartCompanionSessionResponse>(
        '/v1/companion/start',
        { method: 'POST' },
      )
      return { sessionId: res.sessionId, expiresInSec: res.expiresInSec }
    },
  })
}

export function useEndCompanion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await apiFetch<{ ok: true }>('/v1/companion/end', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['companion-quota'] }),
  })
}
