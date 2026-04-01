import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'

const StatusSchema = z.object({
  status: z.enum(['IN_REVIEW', 'REVISION_REQUESTED', 'APPROVED']),
  revisionInstructions: z.object({
    section: z.string(),
    whatToChange: z.string(),
    why: z.string(),
  }).optional(),
})

// PATCH /api/scripts/[id]/status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('REVIEWER', 'ADMIN')
    const { status, revisionInstructions } = StatusSchema.parse(await req.json())

    const script = await prisma.generatedScript.findUnique({ where: { id: params.id } })
    if (!script) return NextResponse.json({ error: 'Script not found' }, { status: 404 })

    await prisma.generatedScript.update({
      where: { id: params.id },
      data: { reviewStatus: status },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'GeneratedScript',
        entityId: params.id,
        action: `STATUS_CHANGED_TO_${status}`,
        userId: session.user.id,
        metadata: { previousStatus: script.reviewStatus, revisionInstructions },
      },
    })

    return NextResponse.json({ id: params.id, status })
  } catch (err) {
    console.error('[PATCH /api/scripts/[id]/status]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
