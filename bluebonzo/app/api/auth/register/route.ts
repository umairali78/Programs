import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { isDbAvailable } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  const { name, email, password, organisation } = await req.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  }

  if (!isDbAvailable()) {
    return NextResponse.json({ error: 'Database not configured. Use demo@bluebonzo.ai / demo123 to sign in.' }, { status: 503 })
  }

  const { db } = await import('@/lib/db/client')
  const { users } = await import('@/lib/db/schema')
  const { eq } = await import('drizzle-orm')

  const existing = await db!.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  await db!.insert(users).values({
    name,
    email,
    password: hashed,
    organisation,
    tier: 'professional',
  })

  return NextResponse.json({ success: true })
}
