import { fetchJsonWithTimeout, withApiCache } from './cache'
import type { LiveApiResult } from './types'

const SEAWEED_HS_CODES = ['121221', '121229', '130231']

interface ComtradeRow {
  reporterISO?: string
  reporterCode?: string | number
  reporterDesc?: string
  partnerISO?: string
  partnerDesc?: string
  flowDesc?: string
  cmdCode?: string
  primaryValue?: number
  netWgt?: number
  period?: string | number
}

interface PubMedSearchResponse {
  esearchresult?: { idlist?: string[] }
}

interface PubMedSummaryResponse {
  result?: Record<string, {
    uid?: string
    title?: string
    fulljournalname?: string
    pubdate?: string
    elocationid?: string
  } | string[]>
}

interface PubMedSummary {
  uid?: string
  title?: string
  fulljournalname?: string
  pubdate?: string
  elocationid?: string
}

interface OpenAlexResponse {
  results?: Array<{
    id?: string
    display_name?: string
    publication_year?: number
    cited_by_count?: number
    doi?: string
    primary_location?: { source?: { display_name?: string } }
  }>
}

interface ErddapSearchResponse {
  table?: {
    columnNames?: string[]
    rows?: unknown[][]
  }
}

export async function fetchComtradeSeaweed(query: string): Promise<LiveApiResult> {
  const year = inferYear(query) ?? new Date().getFullYear() - 1
  const params = { year, hs: SEAWEED_HS_CODES.join(',') }
  const { value, stale } = await withApiCache('comtrade', 'data/v1/get/C/A/HS', params, 86400, async () => {
    const url = new URL('https://comtradeapi.un.org/data/v1/get/C/A/HS')
    url.searchParams.set('cmdCode', SEAWEED_HS_CODES.join(','))
    url.searchParams.set('flowCode', 'X,M')
    url.searchParams.set('period', String(year))
    url.searchParams.set('reporterCode', 'all')
    url.searchParams.set('partnerCode', '0')
    url.searchParams.set('includeDesc', 'true')
    const headers: Record<string, string> = {}
    if (process.env.COMTRADE_API_KEY) headers['Ocp-Apim-Subscription-Key'] = process.env.COMTRADE_API_KEY
    return fetchJsonWithTimeout<{ data?: ComtradeRow[] }>(url.toString(), { headers }, 4000)
  })

  const rows = (value.data ?? []).slice(0, 25).map((row) => ({
    reporter: row.reporterDesc ?? row.reporterISO ?? row.reporterCode,
    partner: row.partnerDesc ?? 'World',
    flow: row.flowDesc,
    hsCode: row.cmdCode,
    valueUsd: row.primaryValue,
    netWeightKg: row.netWgt,
    period: row.period ?? year,
  }))

  return {
    provider: 'comtrade',
    label: 'UN Comtrade seaweed trade flows',
    summary: rows.length > 0
      ? `Retrieved ${rows.length} Comtrade seaweed trade records for HS ${SEAWEED_HS_CODES.join(', ')} in ${year}.`
      : `No live Comtrade rows returned for seaweed HS codes in ${year}.`,
    data: rows,
    sources: [{
      id: 101,
      title: `UN Comtrade Plus seaweed trade data ${year}`,
      url: 'https://comtradeplus.un.org/',
      type: 'api',
      provider: 'UN Comtrade Plus',
      retrievedAt: new Date().toISOString(),
    }],
    retrievedAt: new Date().toISOString(),
    stale,
  }
}

export async function fetchPubMedSeaweed(query: string): Promise<LiveApiResult> {
  const term = buildLiteratureTerm(query)
  const params = { term }
  const { value, stale } = await withApiCache('pubmed', 'eutils/esearch+esummary', params, 21600, async () => {
    const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
    const common = new URLSearchParams({
      db: 'pubmed',
      term,
      retmode: 'json',
      retmax: '8',
      sort: 'pub_date',
      tool: 'BlueBonzoAI',
    })
    if (process.env.NCBI_EMAIL) common.set('email', process.env.NCBI_EMAIL)
    if (process.env.PUBMED_API_KEY) common.set('api_key', process.env.PUBMED_API_KEY)

    const search = await fetchJsonWithTimeout<PubMedSearchResponse>(`${base}/esearch.fcgi?${common.toString()}`, {}, 3500)
    const ids = search.esearchresult?.idlist ?? []
    if (ids.length === 0) return { ids, summaries: [] }

    const summaryParams = new URLSearchParams({
      db: 'pubmed',
      id: ids.join(','),
      retmode: 'json',
      tool: 'BlueBonzoAI',
    })
    if (process.env.NCBI_EMAIL) summaryParams.set('email', process.env.NCBI_EMAIL)
    if (process.env.PUBMED_API_KEY) summaryParams.set('api_key', process.env.PUBMED_API_KEY)
    const summary = await fetchJsonWithTimeout<PubMedSummaryResponse>(`${base}/esummary.fcgi?${summaryParams.toString()}`, {}, 3500)
    const summaries = ids
      .map((id) => summary.result?.[id])
      .filter((item): item is PubMedSummary => Boolean(item) && !Array.isArray(item))
    return { ids, summaries }
  })

  const data = value.summaries.map((paper) => ({
    id: paper.uid,
    title: paper.title,
    journal: paper.fulljournalname,
    date: paper.pubdate,
    locator: paper.elocationid,
  }))

  return {
    provider: 'pubmed',
    label: 'PubMed literature search',
    summary: `Retrieved ${data.length} PubMed records for "${term}".`,
    data,
    sources: [{
      id: 102,
      title: `PubMed search: ${term}`,
      url: 'https://pubmed.ncbi.nlm.nih.gov/',
      type: 'api',
      provider: 'NCBI E-utilities',
      retrievedAt: new Date().toISOString(),
    }],
    retrievedAt: new Date().toISOString(),
    stale,
  }
}

export async function fetchOpenAlexSeaweed(query: string): Promise<LiveApiResult> {
  const search = buildLiteratureTerm(query)
  const params = { search }
  const { value, stale } = await withApiCache('openalex', 'works', params, 21600, async () => {
    const url = new URL('https://api.openalex.org/works')
    url.searchParams.set('search', search)
    url.searchParams.set('per-page', '8')
    url.searchParams.set('sort', 'publication_date:desc')
    if (process.env.OPENALEX_EMAIL) url.searchParams.set('mailto', process.env.OPENALEX_EMAIL)
    return fetchJsonWithTimeout<OpenAlexResponse>(url.toString(), {}, 4000)
  })

  const data = (value.results ?? []).map((work) => ({
    id: work.id,
    title: work.display_name,
    year: work.publication_year,
    citations: work.cited_by_count,
    doi: work.doi,
    source: work.primary_location?.source?.display_name,
  }))

  return {
    provider: 'openalex',
    label: 'OpenAlex research index',
    summary: `Retrieved ${data.length} OpenAlex works for "${search}".`,
    data,
    sources: [{
      id: 103,
      title: `OpenAlex works search: ${search}`,
      url: 'https://api.openalex.org/works',
      type: 'api',
      provider: 'OpenAlex',
      retrievedAt: new Date().toISOString(),
    }],
    retrievedAt: new Date().toISOString(),
    stale,
  }
}

export async function fetchNoaaSeaweedContext(query: string): Promise<LiveApiResult> {
  const searchFor = query.match(/chlorophyll/i) ? 'chlorophyll seaweed' : 'sea surface temperature seaweed'
  const params = { searchFor }
  const { value, stale } = await withApiCache('noaa', 'erddap/search', params, 21600, async () => {
    const url = new URL('https://coastwatch.pfeg.noaa.gov/erddap/search/index.json')
    url.searchParams.set('searchFor', searchFor)
    url.searchParams.set('page', '1')
    url.searchParams.set('itemsPerPage', '8')
    return fetchJsonWithTimeout<ErddapSearchResponse>(url.toString(), {}, 4000)
  })

  const columns = value.table?.columnNames ?? []
  const data = (value.table?.rows ?? []).slice(0, 8).map((row) => Object.fromEntries(
    columns.map((column, index) => [column, row[index]]),
  ))

  return {
    provider: 'noaa',
    label: 'NOAA ERDDAP environmental context',
    summary: `Retrieved ${data.length} NOAA ERDDAP dataset matches for "${searchFor}".`,
    data,
    sources: [{
      id: 104,
      title: `NOAA ERDDAP search: ${searchFor}`,
      url: 'https://coastwatch.pfeg.noaa.gov/erddap/',
      type: 'api',
      provider: 'NOAA CoastWatch ERDDAP',
      retrievedAt: new Date().toISOString(),
    }],
    retrievedAt: new Date().toISOString(),
    stale,
  }
}

export async function fetchWtoTariffContext(query: string): Promise<LiveApiResult> {
  const params = { hs: SEAWEED_HS_CODES.join(','), query }
  const { stale } = await withApiCache('wto', 'tariff-context', params, 604800, async () => ({
    rows: SEAWEED_HS_CODES.map((hsCode) => ({
      hsCode,
      note: 'Seaweed tariff context should be verified against WTO Tariff Data or national tariff schedules for the destination market.',
    })),
  }))

  return {
    provider: 'wto',
    label: 'WTO tariff context',
    summary: 'Prepared WTO tariff context for seaweed HS codes. Destination-specific tariff schedules require live verification in WTO Tariff Data or national customs systems.',
    data: SEAWEED_HS_CODES.map((hsCode) => ({ hsCode })),
    sources: [{
      id: 105,
      title: 'WTO Tariff Data',
      url: 'https://tariffdata.wto.org/',
      type: 'api',
      provider: 'WTO',
      retrievedAt: new Date().toISOString(),
    }],
    retrievedAt: new Date().toISOString(),
    stale,
  }
}

function inferYear(query: string): number | null {
  const match = query.match(/\b(20\d{2})\b/)
  return match ? Number(match[1]) : null
}

function buildLiteratureTerm(query: string): string {
  const q = query.toLowerCase()
  if (q.match(/arsenic|iodine|heavy metal/)) return '(seaweed OR macroalgae) AND (arsenic OR iodine OR heavy metals)'
  if (q.match(/carrageenan/)) return 'carrageenan seaweed'
  if (q.match(/agar/)) return 'agar Gracilaria Gelidium seaweed'
  if (q.match(/alginate/)) return 'alginate kelp seaweed'
  return 'seaweed OR macroalgae'
}
