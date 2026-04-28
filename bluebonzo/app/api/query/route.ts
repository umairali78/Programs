import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDemoResponse } from '@/lib/demo-data/demo-responses'
import type { StructuredQueryResponse } from '@/lib/demo-data/types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { query } = await req.json()
  if (!query || typeof query !== 'string') {
    return new Response(JSON.stringify({ error: 'query is required' }), { status: 400 })
  }

  const startMs = Date.now()

  // Live-first mode: query free APIs, then synthesize with OpenAI when configured.
  try {
    const { orchestrateQuery } = await import('@/lib/query/orchestrator')
    const response = await orchestrateQuery(query, session.user.id)
    await persistQueryHistory(session.user.id, query, response)
    return streamResponse(response)
  } catch (err) {
    console.error('[query] orchestration error:', err)
    // Fall back to demo response on error
    const demoResponse = getDemoResponse(query)
    demoResponse.processingMs = Date.now() - startMs
    await persistQueryHistory(session.user.id, query, demoResponse)
    return streamDemoResponse(demoResponse)
  }
}

async function persistQueryHistory(userId: string, query: string, response: StructuredQueryResponse) {
  try {
    const { isDbAvailable } = await import('@/lib/db/client')
    if (!isDbAvailable()) return
    const { db } = await import('@/lib/db/client')
    const { queryHistory } = await import('@/lib/db/schema')
    await db!.insert(queryHistory).values({
      userId,
      query,
      response: JSON.stringify(response),
      sources: JSON.stringify(response.sources),
      confidence: response.confidence,
      apisUsed: JSON.stringify(response.apisQueried),
      processingMs: response.processingMs,
    })
  } catch (err) {
    console.warn('[query] history persistence failed:', err)
  }
}

function streamDemoResponse(response: StructuredQueryResponse): Response {
  const encoder = new TextEncoder()
  // Simulate word-by-word streaming of the summary
  const words = response.summary.split(' ')
  let wordIndex = 0

  const stream = new ReadableStream({
    async start(controller) {
      // First chunk: metadata + everything except summary
      const metadata = {
        type: 'metadata',
        isDemo: response.isDemo,
        confidence: response.confidence,
        confidenceReason: response.confidenceReason,
        keyDataPoints: response.keyDataPoints,
        regulatoryContext: response.regulatoryContext,
        marketOutlook: response.marketOutlook,
        sources: response.sources,
        charts: response.charts,
        apisQueried: response.apisQueried,
        processingMs: response.processingMs,
        relatedQueries: response.relatedQueries,
        query: response.query,
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`))

      // Stream summary word by word
      await new Promise(resolve => setTimeout(resolve, 100))
      while (wordIndex < words.length) {
        const chunk = {
          type: 'text',
          delta: (wordIndex === 0 ? '' : ' ') + words[wordIndex],
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
        wordIndex++
        await new Promise(resolve => setTimeout(resolve, 25 + Math.random() * 20))
      }

      // Done
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

function streamResponse(response: StructuredQueryResponse): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', response })}\n\n`))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
