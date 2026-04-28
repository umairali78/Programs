import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DEMO_NEWS } from '@/lib/demo-data/seed'
import { isDbAvailable } from '@/lib/db/client'
import { parseListParam } from '@/lib/settings/watch-profile'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const profileTerms = [
    ...parseListParam(url.searchParams.get('commodities')),
    ...parseListParam(url.searchParams.get('regions')),
    ...parseListParam(url.searchParams.get('jurisdictions')),
  ]

  if (!isDbAvailable()) {
    return NextResponse.json({ news: prioritizeByProfile(DEMO_NEWS, profileTerms) })
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { marketNews } = await import('@/lib/db/schema')
    const { desc } = await import('drizzle-orm')
    const rows = await db!.select().from(marketNews).orderBy(desc(marketNews.publishedAt)).limit(10)
    const news = rows.length > 0 ? rows.map((row) => ({
      ...row,
      sentiment: row.sentiment ?? 'neutral',
    })) : DEMO_NEWS
    const filtered = prioritizeByProfile(news, profileTerms)
    return NextResponse.json({ news: filtered })
  } catch {
    return NextResponse.json({ news: prioritizeByProfile(DEMO_NEWS, profileTerms) })
  }
}

function prioritizeByProfile<T extends { title: string; summary: string; category?: string | null }>(rows: readonly T[], terms: string[]): T[] {
  const normalized = terms.map((term) => term.toLowerCase()).filter(Boolean)
  if (normalized.length === 0) return [...rows]
  return [...rows].sort((a, b) => scoreNews(b, normalized) - scoreNews(a, normalized))
}

function scoreNews(row: { title: string; summary: string; category?: string | null }, terms: string[]): number {
  const text = `${row.title} ${row.summary} ${row.category ?? ''}`.toLowerCase()
  return terms.reduce((score, term) => score + (text.includes(term.toLowerCase()) ? 1 : 0), 0)
}
