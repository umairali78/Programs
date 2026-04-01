import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'

// POST /api/templates/[id]/activate — set this template as active for its CO type
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('ADMIN')

    const template = await prisma.contentTemplate.findUnique({ where: { id: params.id } })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    if (template.parseStatus !== 'parsed') {
      return NextResponse.json({ error: 'Template must be parsed before activation' }, { status: 400 })
    }

    // Deactivate all others for this CO type
    await prisma.contentTemplate.updateMany({
      where: { contentObjectType: template.contentObjectType, isActive: true },
      data: { isActive: false },
    })

    await prisma.contentTemplate.update({
      where: { id: params.id },
      data: { isActive: true },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'ContentTemplate',
        entityId: params.id,
        action: 'ACTIVATED',
        userId: session.user.id,
        metadata: { coType: template.contentObjectType, version: template.version },
      },
    })

    return NextResponse.json({ id: params.id, isActive: true })
  } catch (err) {
    console.error('[POST /api/templates/[id]/activate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
