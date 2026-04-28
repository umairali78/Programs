import { openai } from '@/lib/openai'
import { getDemoResponse } from '@/lib/demo-data/demo-responses'
import type { StructuredQueryResponse } from '@/lib/demo-data/types'
import { gatherLiveApiContext } from '@/lib/live-apis'

export async function orchestrateQuery(query: string, _userId: string): Promise<StructuredQueryResponse> {
  const liveContext = await gatherLiveApiContext(query)
  if (!openai) return enrichDemoWithLiveContext(getDemoResponse(query), liveContext)

  const startMs = Date.now()

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are BlueBonzo AI — a market intelligence assistant for the global seaweed (macroalgae) industry.
Your domain expertise covers: seaweed species (Kappaphycus, Eucheuma, Gelidium, Gracilaria, Laminaria, Porphyra, Undaria, Ascophyllum, etc.),
hydrocolloids (carrageenan, agar, alginate), trade (HS codes 1212.21, 1212.29, 1302.31), regulations (EU Novel Food, FDA GRAS, Codex Alimentarius, arsenic MRLs),
pricing, farming regions (SE Asia, Atlantic Europe, East Africa, Japan/Korea), and market applications (food, pharma, cosmetics, agriculture, biofuel).

Respond with a structured JSON object matching this schema:
{
  "summary": "markdown-formatted comprehensive answer (2-4 paragraphs, use **bold** for key figures)",
  "keyDataPoints": [{"label": "...", "value": "...", "change": "...", "changeDirection": "up|down|neutral", "unit": "...", "sourceId": 1}],
  "regulatoryContext": "relevant regulatory information if applicable",
  "marketOutlook": "forward-looking market analysis",
  "confidence": "high|medium|low",
  "confidenceReason": "brief explanation of confidence level",
  "sources": [{"id": 1, "title": "...", "url": "...", "type": "api|web|document|database", "provider": "...", "retrievedAt": "ISO timestamp"}],
  "charts": [{"type": "line|bar|area|pie", "title": "...", "data": [...], "xKey": "...", "yKeys": [{"key": "...", "label": "...", "color": "..."}]}],
  "apisQueried": ["list of data sources used"],
  "relatedQueries": ["4 follow-up query suggestions"]
}

Always cite sources. Use realistic current data. If you're not certain of exact figures, use ranges and set confidence to "medium" or "low".`,
        },
        {
          role: 'system',
          content: `Live API context retrieved before synthesis:
${JSON.stringify(liveContext, null, 2)}

Use this context when relevant. If an API result is stale, sparse, or unavailable, say so clearly and lower confidence.`,
        },
        { role: 'user', content: query },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000,
    })

    const raw = JSON.parse(completion.choices[0].message.content ?? '{}')

    return {
      isDemo: false,
      query,
      summary: raw.summary ?? '',
      keyDataPoints: raw.keyDataPoints ?? [],
      regulatoryContext: raw.regulatoryContext,
      marketOutlook: raw.marketOutlook,
      confidence: raw.confidence ?? 'medium',
      confidenceReason: raw.confidenceReason ?? '',
      sources: raw.sources ?? [],
      charts: raw.charts ?? [],
      apisQueried: raw.apisQueried ?? ['OpenAI GPT-4o', ...liveContext.map((result) => result.label)],
      processingMs: Date.now() - startMs,
      relatedQueries: raw.relatedQueries ?? [],
    }
  } catch (err) {
    console.error('[orchestrator] GPT-4o error:', err)
    return enrichDemoWithLiveContext(getDemoResponse(query), liveContext)
  }
}

function enrichDemoWithLiveContext(
  response: StructuredQueryResponse,
  liveContext: Awaited<ReturnType<typeof gatherLiveApiContext>>,
): StructuredQueryResponse {
  const sources = [
    ...response.sources,
    ...liveContext.flatMap((result) => result.sources),
  ]
  const apisQueried = [
    ...response.apisQueried,
    ...liveContext.map((result) => result.label),
  ]

  return {
    ...response,
    sources,
    apisQueried: [...new Set(apisQueried)],
    confidenceReason: `${response.confidenceReason} Live API context attempted for this query; unavailable sources fall back to cached/demo data.`,
  }
}
