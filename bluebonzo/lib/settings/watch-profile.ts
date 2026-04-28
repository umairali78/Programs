export interface WatchProfile {
  commodities: string[]
  regions: string[]
  jurisdictions: string[]
}

export const DEFAULT_WATCH_PROFILE: WatchProfile = {
  commodities: ['Carrageenan SRC', 'Sodium Alginate'],
  regions: ['Asia-Pacific', 'Europe'],
  jurisdictions: ['EU', 'FDA (US)'],
}

export const COMMODITY_LABEL_TO_ID: Record<string, string> = {
  'Carrageenan SRC': 'carrageenan_src',
  'Carrageenan PRC': 'carrageenan_prc',
  'Agar Food Grade': 'agar_food',
  'Agar Technical': 'agar_tech',
  'Sodium Alginate': 'alginate',
  'Dried Nori': 'nori',
  Spirulina: 'spirulina',
  Chlorella: 'chlorella',
  Kelp: 'kelp_meal',
}

export const REGION_TO_ISO3: Record<string, string[]> = {
  Global: [],
  'Asia-Pacific': ['CHN', 'IDN', 'PHL', 'JPN', 'KOR', 'MYS', 'IND', 'AUS'],
  Europe: ['DEU', 'FRA', 'GBR', 'NLD', 'ESP', 'NOR'],
  'North America': ['USA', 'CAN', 'MEX'],
  'Southeast Asia': ['IDN', 'PHL', 'MYS'],
  'Latin America': ['BRA', 'MEX'],
  Africa: ['TZA', 'MAR', 'ZAF'],
}

export function parseListParam(value: string | null): string[] {
  if (!value) return []
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

export function normalizeCommodityIds(values: string[]): string[] {
  return values
    .map((value) => COMMODITY_LABEL_TO_ID[value] ?? value)
    .filter(Boolean)
}

export function normalizeJurisdictions(values: string[]): string[] {
  return values.map((value) => {
    if (value.includes('FDA')) return 'USA'
    if (value.includes('Codex')) return 'CODEX'
    return value.replace(/\s*\(.+\)\s*/g, '').toUpperCase()
  })
}

export function regionIso3Set(values: string[]): Set<string> {
  const iso3 = values.flatMap((region) => REGION_TO_ISO3[region] ?? [])
  return new Set(iso3)
}
