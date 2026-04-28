import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isDbAvailable } from '@/lib/db/client'
import { DEMO_REPORT_BANK_DOCUMENTS } from '@/lib/demo-data/report-bank'

const DEMO_DOCUMENTS = DEMO_REPORT_BANK_DOCUMENTS.map((doc, index) => ({
  id: doc.id,
  name: doc.name,
  size: 700000 + index * 185000,
  status: 'ready',
  pages: doc.pages,
  chunkCount: Math.max(8, Math.round(doc.pages * 0.75)),
  category: doc.category,
  tags: doc.tags,
  uploadedAt: new Date(Date.now() - doc.addedDaysAgo * 86400000).toISOString(),
}))

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isDbAvailable()) {
    return NextResponse.json({ documents: DEMO_DOCUMENTS })
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { reportBankDocuments } = await import('@/lib/db/schema')
    const { desc, eq } = await import('drizzle-orm')

    const rows = await db!.select().from(reportBankDocuments)
      .where(eq(reportBankDocuments.uploadedById, session.user.id))
      .orderBy(desc(reportBankDocuments.createdAt))
      .limit(100)

    const documents = rows.map((row) => ({
      id: row.id,
      name: row.originalName,
      size: row.fileSize,
      status: row.processingStatus,
      chunkCount: row.chunkCount,
      category: row.category,
      tags: parseJsonArray(row.tags),
      uploadedAt: row.createdAt.toISOString(),
      blobUrl: row.blobUrl,
    }))

    return NextResponse.json({ documents: documents.length > 0 ? documents : DEMO_DOCUMENTS })
  } catch (err) {
    console.error('[report-bank] list failed:', err)
    return NextResponse.json({ documents: DEMO_DOCUMENTS })
  }
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}
