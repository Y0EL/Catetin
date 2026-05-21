import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NotifPrefs, UpdateNotifPrefsInput } from '@catetin/types'
import { apiFetch } from '~/lib/api'

export function useNotifPrefs() {
  return useQuery({
    queryKey: ['notif-prefs'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: true; prefs: NotifPrefs }>('/v1/notif/prefs')
      return res.prefs
    },
  })
}

export function useUpdateNotifPrefs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateNotifPrefsInput) => {
      const res = await apiFetch<{ ok: true; prefs: NotifPrefs }>('/v1/notif/prefs', {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
      return res.prefs
    },
    onSuccess: (prefs) => qc.setQueryData(['notif-prefs'], prefs),
  })
}

export function useTestNotif() {
  return useMutation({
    mutationFn: async () => {
      await apiFetch<{ ok: true; sent: boolean }>('/v1/notif/test', { method: 'POST' })
    },
  })
}
