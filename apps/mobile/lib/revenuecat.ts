import { Platform } from 'react-native'
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases'
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui'

export const CATETIN_PRO_ENTITLEMENT = 'Catetin Pro'

export type CatetinPlan = 'lifetime' | 'yearly' | 'monthly'

export type PaywallResult = 'NOT_PRESENTED' | 'CANCELLED' | 'PURCHASED' | 'RESTORED' | 'ERROR'

export type PurchaseOutcome =
  | { ok: true; info: CustomerInfo }
  | { ok: false; userCancelled: boolean; code: string; message: string }

let configured = false

export function configurePurchases(apiKey: string) {
  if (configured) return
  if (!apiKey) {
    console.warn('RevenueCat API key missing, skipping configure')
    return
  }
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return
  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN)
    Purchases.configure({ apiKey })
    configured = true
  } catch (err) {
    // Expo Go gak punya modul native RevenueCat. Skip diam-diam, fitur Pro mati di Expo Go.
    console.warn('RevenueCat configure failed (probably Expo Go):', err)
  }
}

export function isConfigured() {
  return configured
}

export async function identifyUser(firebaseUid: string) {
  if (!configured) return
  await Purchases.logIn(firebaseUid)
}

export async function signOutPurchases() {
  if (!configured) return
  await Purchases.logOut()
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null
  return Purchases.getCustomerInfo()
}

export async function hasCatetinPro(): Promise<boolean> {
  const info = await getCustomerInfo()
  if (!info) return false
  return Boolean(info.entitlements.active[CATETIN_PRO_ENTITLEMENT])
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null
  const offerings = await Purchases.getOfferings()
  return offerings.current ?? null
}

export function pickPackage(
  offering: PurchasesOffering | null,
  plan: CatetinPlan,
): PurchasesPackage | null {
  if (!offering) return null
  if (plan === 'lifetime') return offering.lifetime ?? null
  if (plan === 'yearly') return offering.annual ?? null
  if (plan === 'monthly') return offering.monthly ?? null
  return null
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    return { ok: true, info: customerInfo }
  } catch (err) {
    const e = err as PurchasesError
    return {
      ok: false,
      userCancelled: Boolean(e.userCancelled),
      code: String(e.code ?? 'UNKNOWN'),
      message: e.message ?? 'Pembelian gagal',
    }
  }
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  try {
    const info = await Purchases.restorePurchases()
    return { ok: true, info }
  } catch (err) {
    const e = err as PurchasesError
    return {
      ok: false,
      userCancelled: false,
      code: String(e.code ?? 'UNKNOWN'),
      message: e.message ?? 'Restore gagal',
    }
  }
}

export async function presentPaywall(): Promise<PaywallResult> {
  const result = await RevenueCatUI.presentPaywall()
  return mapPaywallResult(result)
}

export async function presentPaywallIfNeeded(): Promise<PaywallResult> {
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: CATETIN_PRO_ENTITLEMENT,
  })
  return mapPaywallResult(result)
}

export async function presentCustomerCenter(): Promise<void> {
  await RevenueCatUI.presentCustomerCenter()
}

export type ProStatus = { isPro: boolean; expiresAt: Date | null }

export function subscribeToProStatus(callback: (status: ProStatus) => void): () => void {
  if (!configured) {
    callback({ isPro: false, expiresAt: null })
    return () => {}
  }
  const apply = (info: CustomerInfo) => {
    const ent = info.entitlements.active[CATETIN_PRO_ENTITLEMENT]
    callback({
      isPro: Boolean(ent),
      expiresAt: ent?.expirationDate ? new Date(ent.expirationDate) : null,
    })
  }
  Purchases.getCustomerInfo()
    .then(apply)
    .catch(() => {})
  Purchases.addCustomerInfoUpdateListener(apply)
  return () => Purchases.removeCustomerInfoUpdateListener(apply)
}

export function paywallResultToText(result: PaywallResult): string {
  if (result === 'PURCHASED') return 'Sip, Catetin Pro lo aktif sekarang.'
  if (result === 'RESTORED') return 'Akses Pro lo udah balik.'
  if (result === 'CANCELLED') return 'Oke, bisa coba lagi kapan aja.'
  if (result === 'NOT_PRESENTED') return 'Lo udah Pro, gak perlu paywall.'
  return 'Ada error, coba lagi yuk.'
}

function mapPaywallResult(result: PAYWALL_RESULT): PaywallResult {
  if (result === PAYWALL_RESULT.PURCHASED) return 'PURCHASED'
  if (result === PAYWALL_RESULT.RESTORED) return 'RESTORED'
  if (result === PAYWALL_RESULT.CANCELLED) return 'CANCELLED'
  if (result === PAYWALL_RESULT.NOT_PRESENTED) return 'NOT_PRESENTED'
  return 'ERROR'
}
