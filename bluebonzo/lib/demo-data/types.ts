export interface Source {
  id: number
  title: string
  url: string
  type: 'api' | 'document' | 'database' | 'web'
  provider: string
  retrievedAt: string
}

export interface DataPoint {
  label: string
  value: string
  change?: string
  changeDirection?: 'up' | 'down' | 'neutral'
  unit?: string
  sourceId?: number
}

export interface ChartData {
  type: 'line' | 'bar' | 'area' | 'pie'
  title: string
  data: Record<string, unknown>[]
  xKey: string
  yKeys: { key: string; label: string; color?: string }[]
}

export interface StructuredQueryResponse {
  isDemo: boolean
  query: string
  summary: string
  keyDataPoints: DataPoint[]
  regulatoryContext?: string
  marketOutlook?: string
  confidence: 'high' | 'medium' | 'low'
  confidenceReason: string
  sources: Source[]
  charts: ChartData[]
  apisQueried: string[]
  processingMs: number
  relatedQueries?: string[]
}
