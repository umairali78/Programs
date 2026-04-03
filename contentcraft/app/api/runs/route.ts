import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { getSession, requireRole } from '@/lib/auth'
import { getActiveStandardsVersion } from '@/lib/db/standards'
import { CONTENT_OBJECT_TYPES, type ContentObjectType } from '@/lib/domain/types'
import { stringifyJsonField } from '@/lib/utils/json'
import { processResearchBrief } from '@/lib/jobs/processResearchBrief'

const CO_TYPES: ContentObjectType[] = [...CONTENT_OBJECT_TYPES]

const StartGenerationSchema = z.object({
  sloText: z.string().min(1).max(500),
  grade: z.number().int().min(1).max(12),
  subject: z.string().min(1),
  curriculumContext: z.string().default('Pakistan NC'),
  selectedCOs: z.array(z.enum(['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6', 'CO7'])).min(1),
})

// POST /api/runs — start a new generation run
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN', 'DESIGNER', 'WRITER')
    const body = await req.json()
    const data = StartGenerationSchema.parse(body)

    // Check for existing brief reuse (RM-06)
    const existingBrief = await prisma.researchBrief.findFirst({
      where: {
        sloText: data.sloText,
        grade: data.grade,
        subject: data.subject,
        status: 'approved',
      },
      orderBy: { createdAt: 'desc' },
    })

    // Create a new research brief record
    const brief = await prisma.researchBrief.create({
      data: {
        sloText: data.sloText,
        grade: data.grade,
        subject: data.subject,
        curriculumContext: data.curriculumContext,
        createdById: session.user.id,
        status: 'pending',
      },
    })

    // Process research brief in background (fire-and-forget — no Redis/worker required)
    const jobData = {
      briefId: brief.id,
      sloText: data.sloText,
      grade: data.grade,
      subject: data.subject,
      curriculumContext: data.curriculumContext,
    }
    processResearchBrief(jobData).catch((err) => {
      console.error('[POST /api/runs] Background research brief failed:', err)
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        entityType: 'ResearchBrief',
        entityId: brief.id,
        action: 'CREATED',
        userId: session.user.id,
        metadata: stringifyJsonField({ sloText: data.sloText, grade: data.grade, subject: data.subject }),
      },
    })

    return NextResponse.json({
      briefId: brief.id,
      status: 'researching',
      existingBriefFound: !!existingBrief,
      existingBriefId: existingBrief?.id ?? null,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
    }
    if (err instanceof Error && err.message === 'Unauthenticated') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    if (err instanceof Error && err.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[POST /api/runs]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/runs — list recent runs for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN', 'DESIGNER', 'WRITER', 'REVIEWER')
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

    const isAdmin = session.user.role === 'ADMIN'
    const runs = await prisma.generationRun.findMany({
      where: isAdmin ? {} : { createdById: session.user.id },
      include: {
        researchBrief: { select: { sloText: true, grade: true, subject: true } },
        _count: { select: { generatedScripts: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({ runs, page, limit })
  } catch (err) {
    console.error('[GET /api/runs]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
