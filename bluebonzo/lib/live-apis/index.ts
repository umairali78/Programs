import type { LiveApiResult, QuerySignals } from './types'
import {
  fetchComtradeSeaweed,
  fetchNoaaSeaweedContext,
  fetchOpenAlexSeaweed,
  fetchPubMedSeaweed,
  fetchWtoTariffContext,
} from './providers'

export type { LiveApiResult } from './types'

export function classifyQueryForLiveApis(query: string): QuerySignals {
  const q = query.toLowerCase()
  return {
    wantsTrade: Boolean(q.match(/trade|export|import|tariff|hs code|volume|shipment|flow/)),
    wantsScience: Boolean(q.match(/science|study|research|paper|journal|pubmed|clinical|contaminant|arsenic|iodine|heavy metal/)),
    wantsClimate: Boolean(q.match(/weather|temperature|ocean|sst|chlorophyll|climate|warming|el nino|cultivation risk/)),
    wantsRegulatory: Boolean(q.match(/regulation|regulatory|eu|fda|gras|novel food|codex|wto|tariff|law|compliance/)),
  }
}

export async function gatherLiveApiContext(query: string): Promise<LiveApiResult[]> {
  const signals = classifyQueryForLiveApis(query)
  const tasks: Array<Promise<LiveApiResult>> = []

  if (signals.wantsTrade) tasks.push(withSourceBudget(fetchComtradeSeaweed(query), 'UN Comtrade seaweed trade flows'))
  if (signals.wantsScience) {
    tasks.push(withSourceBudget(fetchPubMedSeaweed(query), 'PubMed literature search'))
    tasks.push(withSourceBudget(fetchOpenAlexSeaweed(query), 'OpenAlex research index'))
  }
  if (signals.wantsClimate) tasks.push(withSourceBudget(fetchNoaaSeaweedContext(query), 'NOAA ERDDAP environmental context'))
  if (signals.wantsRegulatory) tasks.push(withSourceBudget(fetchWtoTariffContext(query), 'WTO tariff context'))

  if (tasks.length === 0) return []

  const settled = await Promise.allSettled(tasks)
  return settled.map((result, index) => {
    if (result.status === 'fulfilled') return result.value
    return {
      provider: 'openalex',
      label: 'Live API unavailable',
      summary: 'A live API source was unavailable and the query will continue with remaining sources and demo fallbacks.',
      data: [],
      sources: [],
      retrievedAt: new Date().toISOString(),
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      stale: index >= 0,
    } satisfies LiveApiResult
  })
}

function withSourceBudget(task: Promise<LiveApiResult>, label: string): Promise<LiveApiResult> {
  return Promise.race([
    task,
    new Promise<LiveApiResult>((resolve) => {
      setTimeout(() => {
        resolve({
          provider: 'openalex',
          label,
          summary: `${label} did not respond inside the interactive query budget, so BlueBonzo continued without blocking the UI.`,
          data: [],
          sources: [],
          retrievedAt: new Date().toISOString(),
          stale: true,
          error: 'Timed out inside live API budget',
        })
      }, 4500)
    }),
  ])
}
