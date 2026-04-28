import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isDbAvailable } from '@/lib/db/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isDbAvailable()) {
    return NextResponse.json({ history: [] })
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { queryHistory } = await import('@/lib/db/schema')
    const { eq, desc } = await import('drizzle-orm')
    const rows = await db!.select({
      id: queryHistory.id,
      query: queryHistory.query,
      confidence: queryHistory.confidence,
      processingMs: queryHistory.processingMs,
      apisUsed: queryHistory.apisUsed,
      isSaved: queryHistory.isSaved,
      savedName: queryHistory.savedName,
      shareToken: queryHistory.shareToken,
      createdAt: queryHistory.createdAt,
    }).from(queryHistory)
      .where(eq(queryHistory.userId, session.user.id))
      .orderBy(desc(queryHistory.createdAt))
      .limit(50)
    return NextResponse.json({ history: rows })
  } catch {
    return NextResponse.json({ history: [] })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (!isDbAvailable()) {
    return NextResponse.json({ id: 'demo-' + Date.now() })
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { queryHistory } = await import('@/lib/db/schema')
    const [row] = await db!.insert(queryHistory).values({
      userId: session.user.id,
      query: body.query,
      response: body.response ? JSON.stringify(body.response) : null,
      sources: body.sources ? JSON.stringify(body.sources) : null,
      confidence: body.confidence,
      apisUsed: body.apisUsed ? JSON.stringify(body.apisUsed) : null,
      processingMs: body.processingMs,
    }).returning({ id: queryHistory.id })
    return NextResponse.json({ id: row.id })
  } catch {
    return NextResponse.json({ id: 'error-' + Date.now() })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  if (!isDbAvailable()) {
    return NextResponse.json({ success: true })
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { queryHistory } = await import('@/lib/db/schema')
    const { eq, and } = await import('drizzle-orm')
    await db!.update(queryHistory).set({
      isSaved: Boolean(body.isSaved),
      savedName: body.savedName ?? null,
    }).where(and(eq(queryHistory.id, body.id), eq(queryHistory.userId, session.user.id)))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
