'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { QueryInput } from '@/components/query/QueryInput'
import { ResponseDisplay } from '@/components/query/ResponseDisplay'
import type { StructuredQueryResponse } from '@/lib/demo-data/types'
import { Waves } from 'lucide-react'

function QueryPageInner() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  const [response, setResponse] = useState<StructuredQueryResponse | null>(null)
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentQuery, setCurrentQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialQuery) {
      handleQuery(initialQuery)
    }
  }, [])  // eslint-disable-line

  async function handleQuery(query: string) {
    setLoading(true)
    setIsStreaming(true)
    setStreamingText('')
    setResponse(null)
    setError('')
    setCurrentQuery(query)

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!res.ok) throw new Error('Query failed')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let metadata: Partial<StructuredQueryResponse> | null = null
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'metadata') {
              metadata = data
            } else if (data.type === 'text') {
              fullText += data.delta
              setStreamingText(fullText)
            } else if (data.type === 'done') {
              if (metadata) {
                setResponse({
                  isDemo: metadata.isDemo ?? true,
                  query,
                  summary: fullText,
                  keyDataPoints: metadata.keyDataPoints ?? [],
                  regulatoryContext: metadata.regulatoryContext,
                  marketOutlook: metadata.marketOutlook,
                  confidence: metadata.confidence ?? 'medium',
                  confidenceReason: metadata.confidenceReason ?? '',
                  sources: metadata.sources ?? [],
                  charts: metadata.charts ?? [],
                  apisQueried: metadata.apisQueried ?? [],
                  processingMs: metadata.processingMs ?? 0,
                  relatedQueries: metadata.relatedQueries ?? [],
                })
              }
              setIsStreaming(false)
            } else if (data.type === 'complete') {
              setResponse(data.response)
              setStreamingText(data.response.summary)
              setIsStreaming(false)
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      console.error(err)
      setError('Failed to process your query. Please try again.')
      setIsStreaming(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Query input area */}
      <div className="border-b border-border bg-card/30 p-4 md:p-6">
        <QueryInput
          onSubmit={handleQuery}
          loading={loading}
          initialQuery={initialQuery}
        />
      </div>

      {/* Response area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!response && !isStreaming && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Waves className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">BlueBonzo Market Intelligence</h2>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              Ask any question about seaweed markets, pricing, trade flows, regulations, or industry developments.
              Get sourced answers in seconds.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 max-w-lg w-full">
              {[
                { icon: '💰', label: 'Pricing Queries', desc: 'Live commodity prices for carrageenan, agar, alginate' },
                { icon: '⚖️', label: 'Regulatory Intelligence', desc: 'EU, FDA, Codex regulatory requirements and changes' },
                { icon: '🌍', label: 'Trade Flows', desc: 'Bilateral trade data, top exporters and importers' },
                { icon: '📈', label: 'Market Analysis', desc: 'Market size, growth forecasts, investment trends' },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="p-3 rounded-xl border border-border bg-card text-left hover:border-primary/30 transition-all">
                  <div className="text-2xl mb-1.5">{icon}</div>
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="m-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {(response || isStreaming) && (
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            {/* Query echo */}
            <div className="mb-4 p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-0.5">Your query</p>
              <p className="text-sm font-medium">{currentQuery}</p>
            </div>

            {(response || isStreaming) && (
              <ResponseDisplay
                response={response ?? {
                  isDemo: true,
                  query: currentQuery,
                  summary: streamingText,
                  keyDataPoints: [],
                  confidence: 'medium',
                  confidenceReason: '',
                  sources: [],
                  charts: [],
                  apisQueried: [],
                  processingMs: 0,
                }}
                streamingText={streamingText}
                isStreaming={isStreaming}
                onRelatedQuery={handleQuery}
                onRegenerate={() => handleQuery(currentQuery)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function QueryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Waves className="w-8 h-8 text-primary animate-pulse" /></div>}>
      <QueryPageInner />
    </Suspense>
  )
}
