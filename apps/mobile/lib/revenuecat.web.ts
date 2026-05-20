export const CATETIN_PRO_ENTITLEMENT = 'Catetin Pro'

export type CatetinPlan = 'lifetime' | 'yearly' | 'monthly'

export type PaywallResult =
  | 'NOT_PRESENTED'
  | 'CANCELLED'
  | 'PURCHASED'
  | 'RESTORED'
  | 'ERROR'

export type PurchaseOutcome =
  | { ok: true; info: null }
  | { ok: false; userCancelled: boolean; code: string; message: string }

const webUnsupported: PurchaseOutcome = {
  ok: false,
  userCancelled: false,
  code: 'WEB_UNSUPPORTED',
  message: 'Pembelian Catetin Pro cuma ada di mobile app',
}

export function configurePurchases(_apiKey: string) {}

export function isConfigured() {
  return false
}

export async function identifyUser(_firebaseUid: string) {}

export async function signOutPurchases() {}

export async function getCustomerInfo(): Promise<null> {
  return null
}

export async function hasCatetinPro(): Promise<boolean> {
  return false
}

export async function getCurrentOffering(): Promise<null> {
  return null
}

export function pickPackage(_offering: null, _plan: CatetinPlan): null {
  return null
}

export async function purchasePackage(_pkg: unknown): Promise<PurchaseOutcome> {
  return webUnsupported
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  return webUnsupported
}

export async function presentPaywall(): Promise<PaywallResult> {
  return 'NOT_PRESENTED'
}

export async function presentPaywallIfNeeded(): Promise<PaywallResult> {
  return 'NOT_PRESENTED'
}

export async function presentCustomerCenter(): Promise<void> {}

export type ProStatus = { isPro: boolean; expiresAt: Date | null }

export function subscribeToProStatus(callback: (status: ProStatus) => void): () => void {
  callback({ isPro: false, expiresAt: null })
  return () => {}
}

export function paywallResultToText(_result: PaywallResult): string {
  return 'Buka di mobile app buat upgrade Catetin Pro'
}
