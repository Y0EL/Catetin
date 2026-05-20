import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { subscribeToAuth } from '~/lib/auth'

export type AuthState = {
  user: User | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    const unsub = subscribeToAuth((user) => setState({ user, loading: false }))
    return () => unsub()
  }, [])

  return state
}
