import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'

// GET /api/scripts/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('ADMIN', 'DESIGNER', 'WRITER', 'REVIEWER')
    const script = await prisma.generatedScript.findUnique({
      where: { id: params.id },
      include: { reviewFeedback: { include: { reviewer: { select: { name: true, email: true } } } } },
    })
    if (!script) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(script)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
