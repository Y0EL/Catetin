import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '~/lib/api'

type LinkingCodeResponse = {
  ok: true
  code: string
  telegramUrl: string
  expiresAt: string
}

export function useLinkTelegram() {
  return useMutation({
    mutationFn: async () => {
      return apiFetch<LinkingCodeResponse>('/v1/linking/code', { method: 'POST' })
    },
  })
}
