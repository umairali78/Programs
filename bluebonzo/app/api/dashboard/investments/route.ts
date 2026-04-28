import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseListParam } from '@/lib/settings/watch-profile'

const DEMO_INVESTMENTS = [
  { company: 'Running Tide', country: 'US', round: 'Series B', amount: 43, currency: 'M', focus: 'Carbon kelp farming', date: 'Mar 2024', sector: 'farming' },
  { company: 'Notpla', country: 'UK', round: 'Series A', amount: 11, currency: 'M', focus: 'Seaweed packaging', date: 'Jan 2024', sector: 'biotech' },
  { company: 'Blue Evolution', country: 'US', round: 'Seed+', amount: 5.2, currency: 'M', focus: 'Regenerative seaweed', date: 'Nov 2023', sector: 'farming' },
  { company: 'Alg&You', country: 'FR', round: 'Series A', amount: 8, currency: 'M', focus: 'Seaweed nutraceuticals', date: 'Sep 2023', sector: 'biotech' },
  { company: 'Seakura', country: 'IL', round: 'Seed', amount: 2.5, currency: 'M', focus: 'Land-based farming', date: 'Jul 2023', sector: 'farming' },
]

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const terms = [...parseListParam(url.searchParams.get('commodities')), ...parseListParam(url.searchParams.get('regions'))]
  return NextResponse.json({
    investments: prioritizeInvestments(DEMO_INVESTMENTS, terms),
    source: 'demo_crunchbase_placeholder',
  })
}

function prioritizeInvestments<T extends { company: string; country: string; focus: string; sector: string }>(rows: T[], terms: string[]): T[] {
  const normalized = terms.map((term) => term.toLowerCase()).filter(Boolean)
  if (normalized.length === 0) return rows
  return [...rows].sort((a, b) => scoreInvestment(b, normalized) - scoreInvestment(a, normalized))
}

function scoreInvestment(row: { company: string; country: string; focus: string; sector: string }, terms: string[]) {
  const text = `${row.company} ${row.country} ${row.focus} ${row.sector}`.toLowerCase()
  return terms.reduce((score, term) => score + (text.includes(term.toLowerCase()) ? 1 : 0), 0)
}
