import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { parseJsonField } from '@/lib/utils/json'

// GET /api/briefs/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('ADMIN', 'DESIGNER', 'WRITER', 'REVIEWER')
    const brief = await prisma.researchBrief.findUnique({ where: { id: params.id } })
    if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Parse JSON string fields into arrays before returning
    return NextResponse.json({
      ...brief,
      prerequisites: parseJsonField<string[]>(brief.prerequisites, []),
      keyVocabulary: parseJsonField<{ term: string; definition: string; gradeAppropriateExample: string }[]>(brief.keyVocabulary, []),
      pakistanExamples: parseJsonField<string[]>(brief.pakistanExamples, []),
      commonMisconceptions: parseJsonField<string[]>(brief.commonMisconceptions, []),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
