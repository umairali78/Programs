import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { stringifyJsonField, parseJsonField } from '@/lib/utils/json'

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN', 'DESIGNER', 'WRITER', 'REVIEWER')
    const configs = await prisma.systemConfig.findMany()
    const result: Record<string, unknown> = {}
    for (const c of configs) {
      const parsed = parseJsonField<{ value?: unknown }>(c.value, {})
      result[c.key] = parsed.value ?? c.value
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const AI_KEYS = new Set(['aiProvider', 'aiModel', 'openaiApiKey', 'anthropicApiKey'])

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const body = await req.json()

    for (const [key, value] of Object.entries(body)) {
      if (AI_KEYS.has(key)) continue // AI config is managed via .env, not the DB
      const jsonValue = stringifyJsonField({ value })
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: jsonValue },
        create: { key, value: jsonValue },
      })
    }

    await prisma.auditLog.create({
      data: {
        entityType: 'SystemConfig', entityId: 'settings',
        action: 'UPDATED', userId: session.user.id, metadata: stringifyJsonField(body),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
