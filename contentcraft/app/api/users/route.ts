import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { stringifyJsonField } from '@/lib/utils/json'

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'DESIGNER', 'WRITER', 'REVIEWER']),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const data = CreateUserSchema.parse(await req.json())

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const hashed = await bcrypt.hash(data.password, 12)
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashed, role: data.role },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'User', entityId: user.id,
        action: 'CREATED', userId: session.user.id,
        metadata: stringifyJsonField({ role: data.role, email: data.email }),
      },
    })

    return NextResponse.json({ id: user.id, email: user.email, role: user.role })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    console.error('[POST /api/users]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
