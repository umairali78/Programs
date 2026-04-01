import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'

// GET /api/briefs/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('ADMIN', 'DESIGNER', 'WRITER', 'REVIEWER')
    const brief = await prisma.researchBrief.findUnique({ where: { id: params.id } })
    if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(brief)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
