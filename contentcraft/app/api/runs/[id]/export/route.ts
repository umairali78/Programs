import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { exportRunAsZip } from '@/lib/export/bundle'

// GET /api/runs/[id]/export — bundle zip of all approved scripts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('ADMIN', 'DESIGNER', 'WRITER', 'REVIEWER')

    const run = await prisma.generationRun.findUnique({
      where: { id: params.id },
      include: {
        generatedScripts: true,
        researchBrief: { select: { sloText: true, grade: true, subject: true } },
      },
    })
    if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })

    const approvedScripts = run.generatedScripts.filter((s) => s.reviewStatus === 'APPROVED')
    if (approvedScripts.length === 0) {
      return NextResponse.json({ error: 'No approved scripts to export' }, { status: 400 })
    }

    const zipBuffer = await exportRunAsZip(approvedScripts, {
      sloText: run.researchBrief?.sloText ?? '',
      grade: run.researchBrief?.grade ?? 0,
      subject: run.researchBrief?.subject ?? '',
    })

    await prisma.exportLog.create({
      data: { runId: params.id, userId: session.user.id, format: 'zip' },
    })

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="run-${params.id}-export.zip"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/runs/[id]/export]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
