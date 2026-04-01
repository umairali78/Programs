import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { researchBriefQueue } from '@/lib/queue'

const Schema = z.object({ focusInstruction: z.string().optional() })

// POST /api/briefs/[id]/regenerate
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('ADMIN', 'DESIGNER', 'WRITER')
    const { focusInstruction } = Schema.parse(await req.json())

    const brief = await prisma.researchBrief.findUnique({ where: { id: params.id } })
    if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Create a new version of the brief
    const newBrief = await prisma.researchBrief.create({
      data: {
        sloText: brief.sloText,
        grade: brief.grade,
        subject: brief.subject,
        curriculumContext: brief.curriculumContext,
        version: brief.version + 1,
        regenerationFocus: focusInstruction,
        status: 'pending',
        createdById: session.user.id,
      },
    })

    await researchBriefQueue.add(`brief-${newBrief.id}`, {
      briefId: newBrief.id,
      sloText: newBrief.sloText,
      grade: newBrief.grade,
      subject: newBrief.subject,
      curriculumContext: newBrief.curriculumContext,
      regenerationFocus: focusInstruction,
    })

    return NextResponse.json({ briefId: newBrief.id })
  } catch (err) {
    console.error('[POST /api/briefs/[id]/regenerate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
