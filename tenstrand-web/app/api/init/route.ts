import { NextResponse } from 'next/server'
import { ensureDatabaseInitialized } from '@/lib/init-db'

export async function POST() {
  try {
    await ensureDatabaseInitialized()
    return NextResponse.json({ ok: true, message: 'Database initialized' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
