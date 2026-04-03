import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { stringifyJsonField } from '@/lib/utils/json'
import { processContentGeneration } from '@/lib/jobs/processContentGeneration'

const Schema = z.object({
  coType: z.enum(['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6', 'CO7']),
})

// POST /api/runs/[id]/generate-single — generate or regenerate a single CO in an existing run
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('ADMIN', 'DESIGNER', 'WRITER')
    const { coType } = Schema.parse(await req.json())

    const run = await prisma.generationRun.findUnique({
      where: { id: params.id },
      include: { researchBrief: true },
    })
    if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })

    // Find existing script for this CO in the run, or create a new one
    let script = await prisma.generatedScript.findFirst({
      where: { runId: params.id, contentObjectType: coType },
      orderBy: { version: 'desc' },
    })

    if (script) {
      await prisma.generatedScript.update({
        where: { id: script.id },
        data: {
          generationMetadata: stringifyJsonField({ status: 'queued' }),
          scriptText: '',
        },
      })
    } else {
      script = await prisma.generatedScript.create({
        data: {
          runId: params.id,
          contentObjectType: coType,
          version: 1,
          scriptText: '',
          generationMetadata: stringifyJsonField({ status: 'queued' }),
        },
      })
    }

    // Fire-and-forget inline generation
    const jobData = { scriptId: script.id, runId: params.id, coType, briefId: run.researchBriefId }
    processContentGeneration(jobData).catch((err) => {
      console.error(`[generate-single] Background generation failed for ${coType}:`, err)
    })

    return NextResponse.json({ scriptId: script.id, status: 'generating' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
    }
    console.error('[POST /api/runs/[id]/generate-single]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
