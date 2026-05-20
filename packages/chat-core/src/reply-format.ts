export function formatRupiah(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString('id-ID', { maximumFractionDigits: 0 })
  return `${sign}Rp ${formatted}`
}

export function formatRupiahShort(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_000_000) {
    const value = abs / 1_000_000
    const formatted = value.toFixed(value < 10 ? 1 : 0).replace('.', ',')
    return `${sign}Rp ${formatted}jt`
  }
  if (abs >= 1000) {
    const value = abs / 1000
    return `${sign}Rp ${Math.round(value)}rb`
  }
  return `${sign}Rp ${abs}`
}

export function buildTransactionReply(input: {
  amount: number
  category: string
  walletName?: string
}): string {
  const wallet = input.walletName ? ` (${input.walletName})` : ''
  return `Tercatat. ${capitalize(input.category)} ${formatRupiah(input.amount)}${wallet}`
}

function capitalize(text: string): string {
  if (text.length === 0) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}
