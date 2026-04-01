import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { uploadToS3, templateS3Key } from '@/lib/storage/s3'
import { templateParseQueue } from '@/lib/queue'
import { randomUUID } from 'crypto'
import type { ContentObjectType } from '@prisma/client'

// POST /api/templates — upload a new template file
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const formData = await req.formData()

    const file = formData.get('file') as File | null
    const coType = formData.get('contentObjectType') as ContentObjectType | null
    if (!file || !coType) {
      return NextResponse.json({ error: 'file and contentObjectType are required' }, { status: 400 })
    }

    const allowed = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6', 'CO7']
    if (!allowed.includes(coType)) {
      return NextResponse.json({ error: `Invalid contentObjectType: ${coType}` }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['docx', 'pdf'].includes(ext)) {
      return NextResponse.json({ error: 'Only .docx and .pdf files are supported' }, { status: 400 })
    }

    // Get next version number
    const latestTemplate = await prisma.contentTemplate.findFirst({
      where: { contentObjectType: coType },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (latestTemplate?.version ?? 0) + 1

    // Upload to S3
    const fileId = randomUUID()
    const s3Key = templateS3Key(coType, fileId, ext)
    const buffer = Buffer.from(await file.arrayBuffer())
    await uploadToS3(s3Key, buffer, file.type || 'application/octet-stream')

    // Deactivate previous active template
    await prisma.contentTemplate.updateMany({
      where: { contentObjectType: coType, isActive: true },
      data: { isActive: false },
    })

    // Create new template record
    const template = await prisma.contentTemplate.create({
      data: {
        contentObjectType: coType,
        version: nextVersion,
        isActive: false, // not active until parse is confirmed
        s3Key,
        fileName: file.name,
        parseStatus: 'pending',
        uploadedById: session.user.id,
      },
    })

    // Enqueue parsing job
    await templateParseQueue.add(`parse-${template.id}`, {
      templateId: template.id,
      s3Key,
      fileName: file.name,
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'ContentTemplate',
        entityId: template.id,
        action: 'UPLOADED',
        userId: session.user.id,
        metadata: { coType, version: nextVersion, fileName: file.name },
      },
    })

    return NextResponse.json({ templateId: template.id, version: nextVersion, parseStatus: 'pending' })
  } catch (err) {
    console.error('[POST /api/templates]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/templates — list all templates
export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN', 'DESIGNER', 'WRITER')
    const coType = req.nextUrl.searchParams.get('coType') as ContentObjectType | null

    const templates = await prisma.contentTemplate.findMany({
      where: coType ? { contentObjectType: coType } : {},
      include: { uploadedBy: { select: { name: true, email: true } } },
      orderBy: [{ contentObjectType: 'asc' }, { version: 'desc' }],
    })

    return NextResponse.json({ templates })
  } catch (err) {
    console.error('[GET /api/templates]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
