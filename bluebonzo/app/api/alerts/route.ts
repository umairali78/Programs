import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DEMO_ALERTS } from '@/lib/demo-data/seed'
import { isDbAvailable } from '@/lib/db/client'
import { normalizeJurisdictions, parseListParam } from '@/lib/settings/watch-profile'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const jurisdictions = normalizeJurisdictions(parseListParam(url.searchParams.get('jurisdictions')))

  if (!isDbAvailable()) {
    return NextResponse.json({ alerts: filterAlerts(withAlertDates(DEMO_ALERTS), jurisdictions) })
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { regulatoryAlerts } = await import('@/lib/db/schema')
    const { eq, desc } = await import('drizzle-orm')
    const rows = await db!.select().from(regulatoryAlerts)
      .where(eq(regulatoryAlerts.userId, session.user.id))
      .orderBy(desc(regulatoryAlerts.createdAt))
      .limit(20)
    const alerts = rows.length > 0 ? rows.map((row) => ({
      ...row,
      sourceUrl: row.sourceUrl ?? '',
      createdAt: row.createdAt.toISOString(),
    })) : withAlertDates(DEMO_ALERTS)
    return NextResponse.json({ alerts: filterAlerts(alerts, jurisdictions) })
  } catch {
    return NextResponse.json({ alerts: filterAlerts(withAlertDates(DEMO_ALERTS), jurisdictions) })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { alertId, id, isRead } = await req.json()
  const targetId = alertId ?? id

  if (!isDbAvailable()) {
    return NextResponse.json({ success: true })
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { regulatoryAlerts } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    await db!.update(regulatoryAlerts).set({ isRead: isRead ?? true }).where(eq(regulatoryAlerts.id, targetId))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

function withAlertDates(alerts: typeof DEMO_ALERTS) {
  return alerts.map((alert, index) => ({
    ...alert,
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
  }))
}

function filterAlerts<T extends { jurisdiction: string }>(alerts: readonly T[], jurisdictions: string[]): T[] {
  if (jurisdictions.length === 0) return [...alerts]
  const selected = new Set(jurisdictions)
  return alerts.filter((alert) => selected.has(alert.jurisdiction.toUpperCase()))
}
