import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '~/lib/api'

type ChannelStatus = { telegram: boolean; whatsapp: boolean }

export function useChannelStatus() {
  return useQuery({
    queryKey: ['channel-status'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: true } & ChannelStatus>('/v1/linking/status')
      return { telegram: res.telegram, whatsapp: res.whatsapp }
    },
  })
}
