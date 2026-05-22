import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '~/lib/api'

type Mode = 'pairing' | 'connected' | 'disconnected'

type StatusResponse = {
  mode: Mode
  pairingCode: string | null
  jid: string | null
}

export function useWhatsappStatus(enabled: boolean) {
  return useQuery({
    queryKey: ['whatsapp-status'],
    enabled,
    refetchInterval: 3000,
    queryFn: async () => {
      const res = await apiFetch<{ ok: true } & StatusResponse>('/v1/whatsapp/status')
      return { mode: res.mode, pairingCode: res.pairingCode, jid: res.jid }
    },
  })
}

export function useStartPairing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      const res = await apiFetch<{ ok: true } & StatusResponse>('/v1/whatsapp/pair', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      })
      return { mode: res.mode, pairingCode: res.pairingCode, jid: res.jid }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['whatsapp-status'] }),
  })
}

export function useUnlinkWhatsapp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await apiFetch<{ ok: true }>('/v1/whatsapp/unlink', { method: 'POST' })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['whatsapp-status'] }),
  })
}
