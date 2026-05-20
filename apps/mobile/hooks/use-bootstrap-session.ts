import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { Category, UserProfile, Wallet } from '@catetin/types'
import { apiFetch } from '~/lib/api'

type SessionResponse = {
  ok: true
  user: UserProfile
  wallets: Wallet[]
  categories: Category[]
}

export function useBootstrapSession(enabled: boolean) {
  const queryClient = useQueryClient()
  const started = useRef(false)

  useEffect(() => {
    if (!enabled || started.current) return
    started.current = true
    apiFetch<SessionResponse>('/v1/auth/session', { method: 'POST' })
      .then((res) => {
        queryClient.setQueryData(['wallets'], res.wallets)
        queryClient.setQueryData(['categories'], res.categories)
      })
      .catch(() => {
        started.current = false
      })
  }, [enabled, queryClient])
}
