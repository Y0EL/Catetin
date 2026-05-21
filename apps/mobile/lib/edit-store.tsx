import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { TransactionDto } from '@catetin/types'

type EditContextValue = {
  editing: TransactionDto | null
  setEditing: (t: TransactionDto | null) => void
}

const EditContext = createContext<EditContextValue | null>(null)

export function EditTransactionProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState<TransactionDto | null>(null)
  const value = useMemo(() => ({ editing, setEditing }), [editing])
  return <EditContext.Provider value={value}>{children}</EditContext.Provider>
}

export function useEditTransaction(): EditContextValue {
  const ctx = useContext(EditContext)
  if (!ctx) throw new Error('useEditTransaction harus dipanggil di dalam EditTransactionProvider')
  return ctx
}
