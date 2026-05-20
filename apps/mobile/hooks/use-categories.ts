import { useQuery } from '@tanstack/react-query'
import type { Category } from '@catetin/types'
import { apiFetch } from '~/lib/api'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: true; categories: Category[] }>('/v1/categories')
      return res.categories
    },
  })
}
