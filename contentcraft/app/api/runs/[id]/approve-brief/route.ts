import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { contentGenerationQueue } from '@/lib/queue'
import { getActiveStandardsVersion } from '@/lib/db/standards'
import type { ContentObjectType } from '@prisma/client'

const ApproveSchema = z.object({
  briefId: z.string(),
  selectedCOs: z.array(z.string()).min(1),
  // Optional user edits to the brief fields
  edits: z.object({
    coreConcept: z.string().optional(),
    prerequisites: z.array(z.string()).optional(),
    keyVocabulary: z.array(z.object({ term: z.string(), definition: z.string(), gradeAppropriateExample: z.string() })).optional(),
    pakistanExamples: z.array(z.string()).optional(),
    commonMisconceptions: z.array(z.string()).optional(),
    pedagogicalNotes: z.string().optional(),
    userNotes: z.string().optional(),
  }).optional(),
})

// POST /api/runs/[id]/approve-brief — approve research brief and kick off content generation
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('ADMIN', 'DESIGNER', 'WRITER')
    const body = await req.json()
    const { briefId, selectedCOs, edits } = ApproveSchema.parse(body)

    const brief = await prisma.researchBrief.findUnique({ where: { id: briefId } })
    if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 })

    // Apply user edits if any
    const briefUpdate: Record<string, unknown> = { status: 'approved' }
    if (edits) {
      Object.assign(briefUpdate, edits)
      briefUpdate.editedByUser = true
      briefUpdate.version = brief.version + 1
    }

    await prisma.researchBrief.update({ where: { id: briefId }, data: briefUpdate })

    // Get active template versions for metadata
    const templates = await prisma.contentTemplate.findMany({
      where: { isActive: true },
      select: { contentObjectType: true, version: true },
    })
    const templateVersionsUsed = Object.fromEntries(
      templates.map((t) => [t.contentObjectType, t.version])
    )

    const standardsVersion = await getActiveStandardsVersion()

    // Create the GenerationRun
    const run = await prisma.generationRun.create({
      data: {
        researchBriefId: briefId,
        status: 'GENERATING',
        selectedCOs,
        templateVersionsUsed,
        standardsVersionUsed: standardsVersion,
        createdById: session.user.id,
      },
    })

    // Create GeneratedScript placeholders and enqueue jobs
    const scriptJobs = await Promise.all(
      selectedCOs.map(async (coType) => {
        const script = await prisma.generatedScript.create({
          data: {
            runId: run.id,
            contentObjectType: coType as ContentObjectType,
            version: 1,
            scriptText: '',
            generationMetadata: { status: 'queued' },
          },
        })

        await contentGenerationQueue.add(`gen-${run.id}-${coType}`, {
          scriptId: script.id,
          runId: run.id,
          coType,
          briefId,
        })

        return script.id
      })
    )

    await prisma.auditLog.create({
      data: {
        entityType: 'GenerationRun',
        entityId: run.id,
        action: 'BRIEF_APPROVED_GENERATION_STARTED',
        userId: session.user.id,
        metadata: { briefId, selectedCOs, scriptCount: scriptJobs.length },
      },
    })

    return NextResponse.json({ runId: run.id, scriptIds: scriptJobs, status: 'generating' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
    }
    console.error('[POST /api/runs/[id]/approve-brief]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
