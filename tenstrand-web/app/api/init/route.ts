import { NextResponse } from 'next/server'
import { ensureDemoDataForHostedDemo } from '@/lib/demo-boot'
import { ensureDatabaseInitialized } from '@/lib/init-db'

export async function POST() {
  try {
    await ensureDatabaseInitialized()
    await ensureDemoDataForHostedDemo()
    return NextResponse.json({ ok: true, message: 'Database initialized' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
