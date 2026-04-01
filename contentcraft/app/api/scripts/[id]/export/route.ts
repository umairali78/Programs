import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { exportScriptAsDocx } from '@/lib/export/docx'
import { exportScriptAsPdf } from '@/lib/export/pdf'

// GET /api/scripts/[id]/export?format=docx|pdf
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('ADMIN', 'DESIGNER', 'WRITER', 'REVIEWER')
    const format = req.nextUrl.searchParams.get('format') ?? 'docx'

    const script = await prisma.generatedScript.findUnique({ where: { id: params.id } })
    if (!script) return NextResponse.json({ error: 'Script not found' }, { status: 404 })

    let buffer: Buffer
    let contentType: string
    let ext: string

    if (format === 'pdf') {
      buffer = await exportScriptAsPdf(script)
      contentType = 'application/pdf'
      ext = 'pdf'
    } else {
      buffer = await exportScriptAsDocx(script)
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ext = 'docx'
    }

    // Log export
    await prisma.exportLog.create({
      data: {
        scriptId: params.id,
        runId: script.runId,
        userId: session.user.id,
        format,
        version: script.version,
      },
    })

    const filename = `${script.contentObjectType}_v${script.version}.${ext}`
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/scripts/[id]/export]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
