import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { exportBriefAsDocx } from '@/lib/export/docx'

// GET /api/briefs/[id]/download — download research brief as Word document
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole('ADMIN', 'DESIGNER', 'WRITER', 'REVIEWER')
    const brief = await prisma.researchBrief.findUnique({ where: { id: params.id } })
    if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const buffer = await exportBriefAsDocx(brief)
    const filename = `research-brief-grade${brief.grade}-${brief.subject.replace(/\s+/g, '-')}.docx`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/briefs/[id]/download]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
