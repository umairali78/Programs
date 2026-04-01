import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { parseJsonField } from '@/lib/utils/json'

// GET /api/runs/[id]/stream — SSE stream for generation progress
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) {
    return new Response('Unauthenticated', { status: 401 })
  }

  const runId = params.id

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Poll every 2 seconds for up to 3 minutes
      const maxIterations = 90
      let i = 0

      const poll = async () => {
        try {
          const run = await prisma.generationRun.findUnique({
            where: { id: runId },
            include: {
              generatedScripts: {
                select: {
                  id: true,
                  contentObjectType: true,
                  version: true,
                  reviewStatus: true,
                  generationMetadata: true,
                  complianceSummary: true,
                },
              },
            },
          })

          if (!run) {
            send({ error: 'Run not found' })
            controller.close()
            return
          }

          send({
            runId: run.id,
            status: run.status,
            scripts: run.generatedScripts.map((s) => ({
              id: s.id,
              coType: s.contentObjectType,
              version: s.version,
              reviewStatus: s.reviewStatus,
              status: parseJsonField<Record<string, string>>(s.generationMetadata, {}).status ?? 'queued',
              hasCompliance: parseJsonField<unknown[]>(s.complianceSummary, []).length > 0,
            })),
          })

          i++
          if (run.status === 'COMPLETE' || run.status === 'FAILED' || i >= maxIterations) {
            controller.close()
            return
          }

          setTimeout(poll, 2000)
        } catch (err) {
          send({ error: 'Stream error' })
          controller.close()
        }
      }

      poll()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
