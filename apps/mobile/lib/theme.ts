import AsyncStorage from '@react-native-async-storage/async-storage'
import { colorScheme } from 'nativewind'
import { create } from 'zustand'

export type ThemePref = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'catetin.theme'

function isPref(value: string | null): value is ThemePref {
  return value === 'light' || value === 'dark' || value === 'system'
}

type ThemeState = {
  pref: ThemePref
  setPref: (next: ThemePref) => void
  hydrate: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  pref: 'system',
  setPref: (next) => {
    set({ pref: next })
    colorScheme.set(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
  },
  hydrate: () => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (isPref(value)) {
          set({ pref: value })
          colorScheme.set(value)
        }
      })
      .catch(() => {})
  },
}))
