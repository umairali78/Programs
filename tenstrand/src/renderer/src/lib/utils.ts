import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

export function formatCost(cost: number | null): string {
  if (cost == null || cost === 0) return 'Free'
  return `$${cost.toFixed(0)}/student`
}

export function formatDistance(miles: number | null): string {
  if (miles == null) return '—'
  return `${miles.toFixed(1)} mi`
}

export function getPartnerTypeColor(type: string): string {
  const colors: Record<string, string> = {
    wetlands: '#2196F3',
    agriculture: '#8BC34A',
    urban_ecology: '#9C27B0',
    climate_justice: '#F44336',
    indigenous_knowledge: '#FF9800',
    general: '#607D8B'
  }
  return colors[type] ?? colors.general
}

export function getPartnerTypeName(type: string): string {
  const names: Record<string, string> = {
    wetlands: 'Wetlands',
    agriculture: 'Agriculture',
    urban_ecology: 'Urban Ecology',
    climate_justice: 'Climate Justice',
    indigenous_knowledge: 'Indigenous Knowledge',
    general: 'General'
  }
  return names[type] ?? 'General'
}

export function scoreToPercent(score: number): number {
  return Math.round(score * 100)
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}
