import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { stringifyJsonField } from '@/lib/utils/json'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('ADMIN')
    await prisma.standardsGuide.updateMany({ where: { isActive: true }, data: { isActive: false } })
    await prisma.standardsGuide.update({ where: { id: params.id }, data: { isActive: true } })
    await prisma.auditLog.create({
      data: {
        entityType: 'StandardsGuide', entityId: params.id,
        action: 'ACTIVATED', userId: session.user.id, metadata: stringifyJsonField({}),
      },
    })
    return NextResponse.json({ id: params.id, isActive: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
