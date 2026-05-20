export const PRESET_EXPENSE_CATEGORIES = [
  { name: 'makanan', icon: 'UtensilsCrossed', color: '#f97316' },
  { name: 'minuman', icon: 'CupSoda', color: '#0ea5e9' },
  { name: 'transportasi', icon: 'Car', color: '#14b8a6' },
  { name: 'belanja', icon: 'ShoppingBag', color: '#6366f1' },
  { name: 'tagihan', icon: 'Receipt', color: '#ef4444' },
  { name: 'hiburan', icon: 'Clapperboard', color: '#d946ef' },
  { name: 'kesehatan', icon: 'HeartPulse', color: '#22c55e' },
  { name: 'pendidikan', icon: 'GraduationCap', color: '#3b82f6' },
  { name: 'lainnya', icon: 'MoreHorizontal', color: '#71717a' },
] as const

export const PRESET_INCOME_CATEGORIES = [
  { name: 'gaji', icon: 'Wallet', color: '#16a34a' },
  { name: 'pemasukan lain', icon: 'PlusCircle', color: '#10b981' },
] as const

export const DEFAULT_WALLET = {
  name: 'Cash',
  type: 'cash',
  icon: 'Wallet',
  color: '#4f46e5',
} as const
