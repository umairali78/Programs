import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { contentGenerationQueue } from '@/lib/queue'

const RegenerateSchema = z.object({
  instruction: z.string().optional(),
})

// POST /api/scripts/[id]/regenerate
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('ADMIN', 'DESIGNER', 'WRITER')
    const { instruction } = RegenerateSchema.parse(await req.json())

    const script = await prisma.generatedScript.findUnique({
      where: { id: params.id },
      include: { run: { include: { researchBrief: true } } },
    })
    if (!script) return NextResponse.json({ error: 'Script not found' }, { status: 404 })

    // Create new version
    const newScript = await prisma.generatedScript.create({
      data: {
        runId: script.runId,
        contentObjectType: script.contentObjectType,
        version: script.version + 1,
        scriptText: '',
        regenerationInstruction: instruction ?? null,
        reviewStatus: 'DRAFT',
        generationMetadata: { status: 'queued' },
      },
    })

    await contentGenerationQueue.add(`regen-${newScript.id}`, {
      scriptId: newScript.id,
      runId: script.runId,
      coType: script.contentObjectType,
      briefId: script.run.researchBriefId,
      regenerationInstruction: instruction,
    })

    return NextResponse.json({ scriptId: newScript.id, version: newScript.version, status: 'queued' })
  } catch (err) {
    console.error('[POST /api/scripts/[id]/regenerate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
