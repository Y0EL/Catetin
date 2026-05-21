import { create } from 'zustand'
import type { TransactionDto } from '@catetin/types'

type EditState = {
  editing: TransactionDto | null
  setEditing: (t: TransactionDto | null) => void
}

export const useEditStore = create<EditState>((set) => ({
  editing: null,
  setEditing: (editing) => set({ editing }),
}))
