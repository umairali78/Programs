import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import type { ContentObjectType } from '@/lib/domain/types'
import { parseJsonField, stringifyJsonField } from '@/lib/utils/json'

const ResolveSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
  adminNotes: z.string().optional(),
  // For ACCEPTED: which suggestion indices to apply
  acceptedIndices: z.array(z.number()).optional(),
})

// PATCH /api/proposals/[id] — accept or reject a proposal
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('ADMIN')
    const { status, adminNotes, acceptedIndices } = ResolveSchema.parse(await req.json())

    const proposal = await prisma.improvementProposal.findUnique({ where: { id: params.id } })
    if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    if (proposal.status !== 'PENDING') {
      return NextResponse.json({ error: 'Proposal already resolved' }, { status: 400 })
    }

    await prisma.improvementProposal.update({
      where: { id: params.id },
      data: { status, adminNotes, resolvedAt: new Date() },
    })

    // If accepted, apply accepted suggestions to prompt library
    if (status === 'ACCEPTED' && proposal.type === 'PROMPT' && acceptedIndices?.length) {
      const suggestions = parseJsonField<{ field: string; suggestedValue: string }[]>(proposal.suggestions, [])
      const toApply = acceptedIndices.map((i) => suggestions[i]).filter(Boolean)

      const currentPrompt = await prisma.promptLibrary.findFirst({
        where: { contentObjectType: proposal.contentObjectType as ContentObjectType, isActive: true },
      })

      if (currentPrompt) {
        const updates: Record<string, string> = {}
        for (const s of toApply) {
          if (['masterPrompt', 'structuralRules', 'outputFormat', 'qualityCriteria'].includes(s.field)) {
            updates[s.field] = s.suggestedValue
          }
        }
        if (Object.keys(updates).length > 0) {
          // Deactivate current, create new version
          await prisma.promptLibrary.update({ where: { id: currentPrompt.id }, data: { isActive: false } })
          await prisma.promptLibrary.create({
            data: {
              ...currentPrompt,
              id: undefined,
              version: currentPrompt.version + 1,
              isActive: true,
              updatedById: session.user.id,
              updatedAt: new Date(),
              ...updates,
            },
          })
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        entityType: 'ImprovementProposal',
        entityId: params.id,
        action: `PROPOSAL_${status}`,
        userId: session.user.id,
        metadata: stringifyJsonField({ adminNotes, acceptedIndices }),
      },
    })

    return NextResponse.json({ id: params.id, status })
  } catch (err) {
    console.error('[PATCH /api/proposals/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
