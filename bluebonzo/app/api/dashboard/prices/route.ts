import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DEMO_PRICES } from '@/lib/demo-data/seed'
import { isDbAvailable } from '@/lib/db/client'
import { normalizeCommodityIds, parseListParam } from '@/lib/settings/watch-profile'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const selectedCommodities = normalizeCommodityIds(parseListParam(url.searchParams.get('commodities')))

  if (!isDbAvailable()) {
    return NextResponse.json(formatPricesResponse(filterPriceRows(DEMO_PRICES, selectedCommodities)))
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { marketPrices } = await import('@/lib/db/schema')
    const { desc } = await import('drizzle-orm')
    const rows = await db!.select().from(marketPrices).orderBy(desc(marketPrices.weekDate)).limit(200)
    return NextResponse.json(formatPricesResponse(filterPriceRows(rows, selectedCommodities)))
  } catch {
    return NextResponse.json(formatPricesResponse(filterPriceRows(DEMO_PRICES, selectedCommodities)))
  }
}

function filterPriceRows<T extends { commodity: string }>(rows: T[], selectedCommodities: string[]): T[] {
  if (selectedCommodities.length === 0) return rows
  const selected = new Set(selectedCommodities)
  return rows.filter((row) => selected.has(row.commodity))
}

function formatPricesResponse(rows: { commodity: string; priceUsd: string | number; unit: string; market: string; weekDate: Date | string }[]) {
  const byCommodity: Record<string, { market: string; price: number; unit: string; weekDate: string; prevPrice?: number }[]> = {}

  for (const row of rows) {
    if (!byCommodity[row.commodity]) byCommodity[row.commodity] = []
    byCommodity[row.commodity].push({
      market: row.market,
      price: typeof row.priceUsd === 'string' ? parseFloat(row.priceUsd) : row.priceUsd,
      unit: row.unit,
      weekDate: row.weekDate instanceof Date ? row.weekDate.toISOString() : String(row.weekDate),
    })
  }

  // Build summary per commodity (latest week, global_avg)
  const summary = Object.entries(byCommodity).map(([commodity, entries]) => {
    const globalAvg = entries.filter(e => e.market === 'global_avg').sort((a, b) => b.weekDate.localeCompare(a.weekDate))
    const latest = globalAvg[0]
    const prev = globalAvg[1]
    const change = latest && prev ? ((latest.price - prev.price) / prev.price) * 100 : 0

    // Get sparkline data (last 12 weeks of global_avg)
    const sparkline = globalAvg.slice(0, 12).reverse().map(e => ({ date: e.weekDate, price: e.price }))

    return {
      commodity,
      latestPrice: latest?.price ?? 0,
      unit: latest?.unit ?? 'per_kg',
      changePercent: change,
      sparkline,
    }
  })

  return { summary, raw: byCommodity }
}
