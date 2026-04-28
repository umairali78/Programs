import type { Source } from '@/lib/demo-data/types'

export type LiveProvider = 'comtrade' | 'pubmed' | 'openalex' | 'noaa' | 'wto'

export interface LiveApiResult {
  provider: LiveProvider
  label: string
  summary: string
  data: Record<string, unknown>[]
  sources: Source[]
  retrievedAt: string
  stale?: boolean
  error?: string
}

export interface QuerySignals {
  wantsTrade: boolean
  wantsScience: boolean
  wantsClimate: boolean
  wantsRegulatory: boolean
}
