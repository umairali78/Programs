import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { uploadToS3, standardsS3Key } from '@/lib/storage/s3'
import { standardsEmbedQueue } from '@/lib/queue'
import { randomUUID } from 'crypto'

// POST /api/standards/upload — upload a new standards guide version
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['docx', 'pdf'].includes(ext)) {
      return NextResponse.json({ error: 'Only .docx and .pdf files are supported' }, { status: 400 })
    }

    const latest = await prisma.standardsGuide.findFirst({ orderBy: { version: 'desc' } })
    const nextVersion = (latest?.version ?? 0) + 1

    const guideId = randomUUID()
    const s3Key = standardsS3Key(guideId, ext)
    const buffer = Buffer.from(await file.arrayBuffer())
    await uploadToS3(s3Key, buffer, file.type || 'application/octet-stream')

    const guide = await prisma.standardsGuide.create({
      data: {
        id: guideId,
        version: nextVersion,
        isActive: false,
        s3Key,
        fileName: file.name,
        uploadedById: session.user.id,
      },
    })

    // Enqueue embedding job
    await standardsEmbedQueue.add(`embed-${guide.id}`, {
      standardsGuideId: guide.id,
      s3Key,
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'StandardsGuide',
        entityId: guide.id,
        action: 'UPLOADED',
        userId: session.user.id,
        metadata: { version: nextVersion, fileName: file.name },
      },
    })

    return NextResponse.json({ guideId: guide.id, version: nextVersion, status: 'embedding' })
  } catch (err) {
    console.error('[POST /api/standards/upload]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/standards/upload (list standards guides)
export async function GET() {
  try {
    await requireRole('ADMIN', 'DESIGNER')
    const guides = await prisma.standardsGuide.findMany({
      include: {
        uploadedBy: { select: { name: true, email: true } },
        _count: { select: { chunks: true } },
      },
      orderBy: { version: 'desc' },
    })
    return NextResponse.json({ guides })
  } catch (err) {
    console.error('[GET /api/standards]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
