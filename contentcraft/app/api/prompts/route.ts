import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import type { ContentObjectType } from '@prisma/client'

const Schema = z.object({
  contentObjectType: z.enum(['CO1','CO2','CO3','CO4','CO5','CO6','CO7']),
  masterPrompt: z.string().min(1),
  structuralRules: z.string().min(1),
  outputFormat: z.string().min(1),
  qualityCriteria: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const data = Schema.parse(await req.json())

    const latest = await prisma.promptLibrary.findFirst({
      where: { contentObjectType: data.contentObjectType as ContentObjectType },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (latest?.version ?? 0) + 1

    // Deactivate current
    await prisma.promptLibrary.updateMany({
      where: { contentObjectType: data.contentObjectType as ContentObjectType, isActive: true },
      data: { isActive: false },
    })

    const prompt = await prisma.promptLibrary.create({
      data: {
        contentObjectType: data.contentObjectType as ContentObjectType,
        version: nextVersion,
        isActive: true,
        masterPrompt: data.masterPrompt,
        structuralRules: data.structuralRules,
        outputFormat: data.outputFormat,
        qualityCriteria: data.qualityCriteria,
        updatedById: session.user.id,
      },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'PromptLibrary', entityId: prompt.id,
        action: 'UPDATED', userId: session.user.id,
        metadata: { coType: data.contentObjectType, version: nextVersion },
      },
    })

    return NextResponse.json({ id: prompt.id, version: nextVersion })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    console.error('[POST /api/prompts]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
