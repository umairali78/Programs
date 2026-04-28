import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isDbAvailable } from '@/lib/db/client'
import { DEMO_REPORT_BANK_DOCUMENTS } from '@/lib/demo-data/report-bank'
import { parseListParam } from '@/lib/settings/watch-profile'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const terms = [
    ...parseListParam(url.searchParams.get('commodities')),
    ...parseListParam(url.searchParams.get('regions')),
    ...parseListParam(url.searchParams.get('jurisdictions')),
  ]
  const demoReports = prioritizeReports(DEMO_REPORT_BANK_DOCUMENTS, terms).slice(0, 8)

  if (!isDbAvailable()) return NextResponse.json({ reports: demoReports })

  try {
    const { db } = await import('@/lib/db/client')
    const { reportBankDocuments } = await import('@/lib/db/schema')
    const { desc, eq } = await import('drizzle-orm')

    const rows = await db!.select().from(reportBankDocuments)
      .where(eq(reportBankDocuments.uploadedById, session.user.id))
      .orderBy(desc(reportBankDocuments.createdAt))
      .limit(5)

    const reports = rows.map((row) => ({
      id: row.id,
      name: row.originalName,
      pages: undefined,
      tags: parseTags(row.tags),
      addedDaysAgo: Math.max(0, Math.floor((Date.now() - row.createdAt.getTime()) / 86400000)),
      category: formatCategory(row.category),
    }))

    return NextResponse.json({ reports: reports.length > 0 ? prioritizeReports(reports, terms) : demoReports })
  } catch {
    return NextResponse.json({ reports: demoReports })
  }
}

function parseTags(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function formatCategory(value: string | null): string {
  if (!value) return 'Internal'
  return value.split(/[_-]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function prioritizeReports<T extends { name: string; category: string; tags: string[] }>(reports: T[], terms: string[]): T[] {
  const normalized = terms.map((term) => term.toLowerCase()).filter(Boolean)
  if (normalized.length === 0) return reports
  return [...reports].sort((a, b) => scoreReport(b, normalized) - scoreReport(a, normalized))
}

function scoreReport(report: { name: string; category: string; tags: string[] }, terms: string[]) {
  const text = `${report.name} ${report.category} ${report.tags.join(' ')}`.toLowerCase()
  return terms.reduce((score, term) => score + (text.includes(term.toLowerCase()) ? 1 : 0), 0)
}
