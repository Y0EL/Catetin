import {
  Car,
  Clapperboard,
  CupSoda,
  GraduationCap,
  HeartPulse,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native'

export type CategoryKey =
  | 'makanan'
  | 'minuman'
  | 'transportasi'
  | 'belanja'
  | 'tagihan'
  | 'hiburan'
  | 'kesehatan'
  | 'pendidikan'
  | 'lainnya'

export type CategoryMeta = {
  key: CategoryKey
  label: string
  icon: LucideIcon
  tint: string
  soft: string
}

const lainnya: CategoryMeta = {
  key: 'lainnya',
  label: 'Lainnya',
  icon: MoreHorizontal,
  tint: '#71717a',
  soft: 'rgba(113,113,122,0.12)',
}

export const categoryList: CategoryMeta[] = [
  {
    key: 'makanan',
    label: 'Makanan',
    icon: UtensilsCrossed,
    tint: '#f97316',
    soft: 'rgba(249,115,22,0.12)',
  },
  {
    key: 'minuman',
    label: 'Minuman',
    icon: CupSoda,
    tint: '#0ea5e9',
    soft: 'rgba(14,165,233,0.12)',
  },
  {
    key: 'transportasi',
    label: 'Transportasi',
    icon: Car,
    tint: '#14b8a6',
    soft: 'rgba(20,184,166,0.12)',
  },
  {
    key: 'belanja',
    label: 'Belanja',
    icon: ShoppingBag,
    tint: '#6366f1',
    soft: 'rgba(99,102,241,0.12)',
  },
  {
    key: 'tagihan',
    label: 'Tagihan',
    icon: Receipt,
    tint: '#ef4444',
    soft: 'rgba(239,68,68,0.12)',
  },
  {
    key: 'hiburan',
    label: 'Hiburan',
    icon: Clapperboard,
    tint: '#d946ef',
    soft: 'rgba(217,70,239,0.12)',
  },
  {
    key: 'kesehatan',
    label: 'Kesehatan',
    icon: HeartPulse,
    tint: '#22c55e',
    soft: 'rgba(34,197,94,0.12)',
  },
  {
    key: 'pendidikan',
    label: 'Pendidikan',
    icon: GraduationCap,
    tint: '#3b82f6',
    soft: 'rgba(59,130,246,0.12)',
  },
  lainnya,
]

export function getCategoryMeta(key: CategoryKey): CategoryMeta {
  return categoryList.find((c) => c.key === key) ?? lainnya
}
