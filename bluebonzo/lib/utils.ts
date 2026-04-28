import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'USD', decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', opts ?? { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(d)
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function getCountryName(iso3: string): string {
  const map: Record<string, string> = {
    CHN: 'China', IDN: 'Indonesia', PHL: 'Philippines', JPN: 'Japan',
    KOR: 'South Korea', MYS: 'Malaysia', DEU: 'Germany', USA: 'United States',
    FRA: 'France', GBR: 'United Kingdom', NLD: 'Netherlands', ESP: 'Spain',
    IND: 'India', TZA: 'Tanzania', MAR: 'Morocco', NOR: 'Norway',
    CAN: 'Canada', AUS: 'Australia', BRA: 'Brazil', MEX: 'Mexico',
    ZAF: 'South Africa', CHL: 'Chile',
  }
  return map[iso3] ?? iso3
}

export function getCountryFlag(iso3: string): string {
  const iso2Map: Record<string, string> = {
    CHN: 'CN', IDN: 'ID', PHL: 'PH', JPN: 'JP', KOR: 'KR', MYS: 'MY',
    DEU: 'DE', USA: 'US', FRA: 'FR', GBR: 'GB', NLD: 'NL', ESP: 'ES',
    IND: 'IN', TZA: 'TZ', MAR: 'MA', NOR: 'NO', CAN: 'CA', AUS: 'AU',
    BRA: 'BR', MEX: 'MX',
    ZAF: 'ZA', CHL: 'CL',
  }
  const iso2 = iso2Map[iso3]
  if (!iso2) return '🌐'
  return iso2.replace(/./g, (c) => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
}
