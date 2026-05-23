import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { T, type Lang, type TKey } from './translations'

export type { Lang }

const STORAGE_KEY = 'catetin.lang'

function detectLang(): Lang {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase()
  if (locale.startsWith('id') || locale.startsWith('ms')) return 'id'
  if (locale.startsWith('zh')) return 'zh'
  return 'en'
}

type LangContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'id' || v === 'en' || v === 'zh') setLangState(v)
      })
      .catch(() => {})
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {})
  }, [])

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be called inside LangProvider')
  return ctx
}

export function useT() {
  const { lang } = useLang()
  return useCallback(
    (key: TKey, vars?: Record<string, string | number>): string => {
      let str = T[key]?.[lang] ?? String(key)
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
        }
      }
      return str
    },
    [lang],
  )
}
