import { useCallback, useEffect, useState } from 'react'
import {
  paywallResultToText,
  presentCustomerCenter,
  presentPaywall,
  restorePurchases as restore,
  subscribeToProStatus,
  type PaywallResult,
  type ProStatus,
} from '~/lib/revenuecat'

export type SubscriptionState = ProStatus & { loading: boolean }

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    expiresAt: null,
    loading: true,
  })

  useEffect(() => {
    let mounted = true
    const unsub = subscribeToProStatus((status) => {
      if (!mounted) return
      setState({ ...status, loading: false })
    })
    return () => {
      mounted = false
      unsub()
    }
  }, [])

  const openPaywall = useCallback(async () => {
    const result: PaywallResult = await presentPaywall()
    return { result, message: paywallResultToText(result) }
  }, [])

  const openCustomerCenter = useCallback(async () => {
    await presentCustomerCenter()
  }, [])

  const restorePurchases = useCallback(async () => {
    return restore()
  }, [])

  return { ...state, openPaywall, openCustomerCenter, restorePurchases }
}
