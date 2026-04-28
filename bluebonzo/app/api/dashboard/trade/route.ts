import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DEMO_TRADE_FLOWS } from '@/lib/demo-data/seed'
import { isDbAvailable } from '@/lib/db/client'
import { getCountryName } from '@/lib/utils'
import { parseListParam, regionIso3Set } from '@/lib/settings/watch-profile'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const regionIso3 = regionIso3Set(parseListParam(url.searchParams.get('regions')))

  let rows = DEMO_TRADE_FLOWS

  if (isDbAvailable()) {
    try {
      const { db } = await import('@/lib/db/client')
      const { tradeFlows } = await import('@/lib/db/schema')
      const { eq } = await import('drizzle-orm')
      const dbRows = await db!.select().from(tradeFlows).where(eq(tradeFlows.flowType, 'export'))
      if (dbRows.length > 0) rows = dbRows as typeof rows
    } catch { /* use demo */ }
  }

  if (regionIso3.size > 0) {
    rows = rows.filter((row) => regionIso3.has(row.reporterIso3) || regionIso3.has(row.partnerIso3))
  }

  const years = rows.map((r: { year: number }) => r.year).filter(Boolean)
  const selectedYear = years.length > 0 ? Math.max(...years) : 2023
  const previousYear = selectedYear - 1
  const ySelected = rows.filter((r: { year: number }) => r.year === selectedYear)
  const yPrevious = rows.filter((r: { year: number }) => r.year === previousYear)

  // Aggregate by reporter (exporter)
  const byExporter: Record<string, number> = {}
  const byExporterPrevious: Record<string, number> = {}
  for (const row of ySelected) {
    const val = typeof row.valueUsd === 'string' ? parseFloat(row.valueUsd) : (row.valueUsd ?? 0)
    byExporter[row.reporterIso3] = (byExporter[row.reporterIso3] ?? 0) + val
  }
  for (const row of yPrevious) {
    const val = typeof row.valueUsd === 'string' ? parseFloat(row.valueUsd) : (row.valueUsd ?? 0)
    byExporterPrevious[row.reporterIso3] = (byExporterPrevious[row.reporterIso3] ?? 0) + val
  }

  const totalExports = Object.values(byExporter).reduce((sum, value) => sum + value, 0)
  const exporters = Object.entries(byExporter)
    .map(([iso3, value]) => ({
      iso3,
      country: getCountryName(iso3),
      value,
      share: totalExports > 0 ? (value / totalExports) * 100 : 0,
      change: getPercentChange(value, byExporterPrevious[iso3] ?? 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Aggregate by partner (importer)
  const byImporter: Record<string, number> = {}
  const byImporterPrevious: Record<string, number> = {}
  for (const row of ySelected) {
    const val = typeof row.valueUsd === 'string' ? parseFloat(row.valueUsd) : (row.valueUsd ?? 0)
    byImporter[row.partnerIso3] = (byImporter[row.partnerIso3] ?? 0) + val
  }
  for (const row of yPrevious) {
    const val = typeof row.valueUsd === 'string' ? parseFloat(row.valueUsd) : (row.valueUsd ?? 0)
    byImporterPrevious[row.partnerIso3] = (byImporterPrevious[row.partnerIso3] ?? 0) + val
  }

  const totalImports = Object.values(byImporter).reduce((sum, value) => sum + value, 0)
  const importers = Object.entries(byImporter)
    .map(([iso3, value]) => ({
      iso3,
      country: getCountryName(iso3),
      value,
      share: totalImports > 0 ? (value / totalImports) * 100 : 0,
      change: getPercentChange(value, byImporterPrevious[iso3] ?? 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // HS code breakdown
  const byHs: Record<string, number> = {}
  for (const row of ySelected) {
    const val = typeof row.valueUsd === 'string' ? parseFloat(row.valueUsd) : (row.valueUsd ?? 0)
    byHs[row.hsCode] = (byHs[row.hsCode] ?? 0) + val
  }

  // Year-over-year
  const yoy: Record<number, number> = {}
  for (const row of rows as Array<{ year: number; valueUsd: string | number }>) {
    const val = typeof row.valueUsd === 'string' ? parseFloat(row.valueUsd) : (row.valueUsd ?? 0)
    yoy[row.year] = (yoy[row.year] ?? 0) + val
  }

  return NextResponse.json({
    exporters,
    importers,
    year: selectedYear,
    totalValue: totalExports,
    byHsCode: byHs,
    yearOverYear: yoy,
  })
}

function getPercentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}
