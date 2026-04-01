import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const body = await req.json()

    for (const [key, value] of Object.entries(body)) {
      const jsonValue = { value: value as number }
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: jsonValue },
        create: { key, value: jsonValue },
      })
    }

    await prisma.auditLog.create({
      data: {
        entityType: 'SystemConfig', entityId: 'settings',
        action: 'UPDATED', userId: session.user.id, metadata: body,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
