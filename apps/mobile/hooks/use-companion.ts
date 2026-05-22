import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CompanionMessageDto,
  CompanionQuota,
  CompanionTurnResponse,
  StartCompanionSessionResponse,
} from '@catetin/types'
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

export function useCompanionTurn() {
  return useMutation({
    mutationFn: async (input: { sessionId: string; audio: string; mimeType: string }) => {
      const res = await apiFetch<{ ok: true } & CompanionTurnResponse>('/v1/companion/turn', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return {
        text: res.text,
        audio: res.audio,
        mimeType: res.mimeType,
        transcript: res.transcript,
      }
    },
  })
}

export function useCompanionHistory() {
  return useQuery({
    queryKey: ['companion-history'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: true; messages: CompanionMessageDto[] }>(
        '/v1/companion/history?limit=50',
      )
      return res.messages
    },
  })
}

export function useClearHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await apiFetch<{ ok: true }>('/v1/companion/history', { method: 'DELETE' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companion-history'] }),
  })
}
