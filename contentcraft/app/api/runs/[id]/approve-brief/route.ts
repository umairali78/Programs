import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { getActiveStandardsVersion } from '@/lib/db/standards'
import type { ContentObjectType } from '@/lib/domain/types'
import { stringifyJsonField } from '@/lib/utils/json'
import { processContentGeneration } from '@/lib/jobs/processContentGeneration'

const ApproveSchema = z.object({
  briefId: z.string(),
  selectedCOs: z.array(z.string()).min(1),
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
      Object.assign(briefUpdate, {
        ...edits,
        prerequisites: edits.prerequisites ? stringifyJsonField(edits.prerequisites) : undefined,
        keyVocabulary: edits.keyVocabulary ? stringifyJsonField(edits.keyVocabulary) : undefined,
        pakistanExamples: edits.pakistanExamples ? stringifyJsonField(edits.pakistanExamples) : undefined,
        commonMisconceptions: edits.commonMisconceptions ? stringifyJsonField(edits.commonMisconceptions) : undefined,
      })
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
        selectedCOs: stringifyJsonField(selectedCOs),
        templateVersionsUsed: stringifyJsonField(templateVersionsUsed),
        standardsVersionUsed: standardsVersion,
        createdById: session.user.id,
      },
    })

    // Create GeneratedScript placeholders and kick off inline background generation
    const scriptIds: string[] = []
    for (const coType of selectedCOs) {
      const script = await prisma.generatedScript.create({
        data: {
          runId: run.id,
          contentObjectType: coType,
          version: 1,
          scriptText: '',
          generationMetadata: stringifyJsonField({ status: 'queued' }),
        },
      })
      scriptIds.push(script.id)

      // Fire-and-forget: run content generation inline without BullMQ/Redis
      const jobData = { scriptId: script.id, runId: run.id, coType, briefId }
      processContentGeneration(jobData).catch((err) => {
        console.error(`[approve-brief] Background generation failed for ${coType}:`, err)
      })
    }

    await prisma.auditLog.create({
      data: {
        entityType: 'GenerationRun',
        entityId: run.id,
        action: 'BRIEF_APPROVED_GENERATION_STARTED',
        userId: session.user.id,
        metadata: stringifyJsonField({ briefId, selectedCOs, scriptCount: scriptIds.length }),
      },
    })

    return NextResponse.json({ runId: run.id, scriptIds, status: 'generating' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
    }
    console.error('[POST /api/runs/[id]/approve-brief]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
