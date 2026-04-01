import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { checkImprovementTrigger } from '@/lib/db/feedback'
import type { ContentObjectType } from '@/lib/domain/types'
import { stringifyJsonField } from '@/lib/utils/json'

const FeedbackSchema = z.object({
  scriptId: z.string(),
  standardsCompliance: z.number().int().min(1).max(5),
  gradeAppropriateness: z.number().int().min(1).max(5),
  templateAdherence: z.number().int().min(1).max(5),
  engagementQuality: z.number().int().min(1).max(5),
  pakistanContextAccuracy: z.number().int().min(1).max(5),
  freeText: z.string().max(1000).optional(),
  annotations: z.array(z.object({
    startOffset: z.number(),
    endOffset: z.number(),
    selectedText: z.string(),
    comment: z.string(),
  })).optional(),
})

// POST /api/feedback
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('REVIEWER', 'ADMIN')
    const data = FeedbackSchema.parse(await req.json())

    const script = await prisma.generatedScript.findUnique({
      where: { id: data.scriptId },
      select: { id: true, contentObjectType: true },
    })
    if (!script) return NextResponse.json({ error: 'Script not found' }, { status: 404 })

    const feedback = await prisma.reviewFeedback.create({
      data: {
        scriptId: data.scriptId,
        reviewerId: session.user.id,
        standardsCompliance: data.standardsCompliance,
        gradeAppropriateness: data.gradeAppropriateness,
        templateAdherence: data.templateAdherence,
        engagementQuality: data.engagementQuality,
        pakistanContextAccuracy: data.pakistanContextAccuracy,
        freeText: data.freeText,
        annotations: stringifyJsonField(data.annotations ?? []),
      },
    })

    // Transition script to IN_REVIEW if still DRAFT
    await prisma.generatedScript.updateMany({
      where: { id: data.scriptId, reviewStatus: 'DRAFT' },
      data: { reviewStatus: 'IN_REVIEW' },
    })

    // Check if improvement proposals should be triggered
    await checkImprovementTrigger(data.scriptId, script.contentObjectType as ContentObjectType)

    return NextResponse.json({ id: feedback.id, status: 'submitted' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
    }
    console.error('[POST /api/feedback]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
