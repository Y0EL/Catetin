import AsyncStorage from '@react-native-async-storage/async-storage'
import { colorScheme } from 'nativewind'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Appearance } from 'react-native'

export type ThemePref = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'catetin.theme'

function isPref(value: string | null): value is ThemePref {
  return value === 'light' || value === 'dark' || value === 'system'
}

type ThemeContextValue = {
  pref: ThemePref
  setPref: (next: ThemePref) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>('system')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (isPref(value)) setPrefState(value)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (pref === 'light' || pref === 'dark') {
      colorScheme.set(pref)
      return
    }
    const apply = () => {
      const os = Appearance.getColorScheme()
      colorScheme.set(os === 'dark' ? 'dark' : 'light')
    }
    apply()
    const sub = Appearance.addChangeListener(apply)
    return () => sub.remove()
  }, [pref])

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
  }, [])

  return <ThemeContext.Provider value={{ pref, setPref }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme harus dipanggil di dalam ThemeProvider')
  return ctx
}
