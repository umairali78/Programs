import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isDbAvailable } from '@/lib/db/client'
import { DEFAULT_WATCH_PROFILE } from '@/lib/settings/watch-profile'

const DEFAULT_SETTINGS = {
  watchProfile: DEFAULT_WATCH_PROFILE,
  preferences: {
    emailAlerts: true,
    weeklyDigest: true,
    theme: 'Dark' as const,
  },
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isDbAvailable()) return NextResponse.json(DEFAULT_SETTINGS)

  try {
    const { db } = await import('@/lib/db/client')
    const { users } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const [user] = await db!.select({
      watchProfile: users.watchProfile,
      preferences: users.preferences,
    }).from(users).where(eq(users.id, session.user.id)).limit(1)

    return NextResponse.json({
      watchProfile: parseJson(user?.watchProfile, DEFAULT_SETTINGS.watchProfile),
      preferences: parseJson(user?.preferences, DEFAULT_SETTINGS.preferences),
    })
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const watchProfile = body.watchProfile ?? DEFAULT_SETTINGS.watchProfile
  const preferences = body.preferences ?? DEFAULT_SETTINGS.preferences

  if (!isDbAvailable()) {
    return NextResponse.json({ success: true, watchProfile, preferences })
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { users } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    await db!.update(users).set({
      watchProfile: JSON.stringify(watchProfile),
      preferences: JSON.stringify(preferences),
      updatedAt: new Date(),
    }).where(eq(users.id, session.user.id))
    return NextResponse.json({ success: true, watchProfile, preferences })
  } catch (err) {
    console.error('[settings] save failed:', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}
