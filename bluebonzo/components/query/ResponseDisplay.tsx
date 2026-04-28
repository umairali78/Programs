'use client'

import { TrendingUp, TrendingDown, Minus, ArrowRight, Copy, Download, RefreshCw, Database, Zap } from 'lucide-react'
import { ConfidenceBadge } from './ConfidenceBadge'
import { SourceCitations } from './SourceCitations'
import { InlineChart } from './InlineChart'
import { cn, formatRelative } from '@/lib/utils'
import type { StructuredQueryResponse, DataPoint } from '@/lib/demo-data/types'

interface ResponseDisplayProps {
  response: StructuredQueryResponse
  streamingText: string
  isStreaming: boolean
  onRelatedQuery?: (query: string) => void
  onRegenerate?: () => void
}

export function ResponseDisplay({ response, streamingText, isStreaming, onRelatedQuery, onRegenerate }: ResponseDisplayProps) {
  const displayText = isStreaming ? streamingText : response.summary

  async function copyResponse() {
    const text = `${response.query}\n\n${response.summary}\n\n${response.keyDataPoints.map(dp => `${dp.label}: ${dp.value}`).join('\n')}`
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="animate-fade-in">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <ConfidenceBadge level={response.confidence} reason={response.confidenceReason} />
          {response.isDemo && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              <Zap className="w-3 h-3" />
              Demo Response
            </div>
          )}
          {response.apisQueried.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary border border-border text-xs text-muted-foreground">
              <Database className="w-3 h-3" />
              {response.apisQueried.slice(0, 3).join(', ')}
              {response.apisQueried.length > 3 && ` +${response.apisQueried.length - 3}`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-muted-foreground">{response.processingMs}ms</span>
          <button onClick={copyResponse} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" title="Copy response">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRegenerate} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" title="Regenerate">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" title="Export">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <span className="w-1 h-3.5 rounded-full bg-primary inline-block" />
          Executive Summary
        </h3>
        <div className={cn('prose prose-sm prose-invert max-w-none text-sm leading-relaxed', isStreaming && 'streaming-cursor')}>
          <FormattedMarkdown text={displayText} />
        </div>
      </section>

      {/* Key Data Points */}
      {response.keyDataPoints.length > 0 && !isStreaming && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <span className="w-1 h-3.5 rounded-full bg-chart-2 inline-block" />
            Key Data Points
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {response.keyDataPoints.map((dp, i) => (
              <DataPointCard key={i} dp={dp} />
            ))}
          </div>
        </section>
      )}

      {/* Charts */}
      {!isStreaming && response.charts.map((chart, i) => (
        <InlineChart key={i} chart={chart} />
      ))}

      {/* Regulatory Context */}
      {!isStreaming && response.regulatoryContext && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-1 h-3.5 rounded-full bg-amber-500 inline-block" />
            Regulatory Context
          </h3>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-sm text-foreground/90 leading-relaxed">
            <FormattedMarkdown text={response.regulatoryContext} />
          </div>
        </section>
      )}

      {/* Market Outlook */}
      {!isStreaming && response.marketOutlook && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-1 h-3.5 rounded-full bg-chart-3 inline-block" />
            Market Outlook
          </h3>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border text-sm leading-relaxed">
            <FormattedMarkdown text={response.marketOutlook} />
          </div>
        </section>
      )}

      {/* Sources */}
      {!isStreaming && response.sources.length > 0 && (
        <SourceCitations sources={response.sources} />
      )}

      {/* Related Queries */}
      {!isStreaming && response.relatedQueries && response.relatedQueries.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Related Queries</h3>
          <div className="grid gap-2">
            {response.relatedQueries.map((rq, i) => (
              <button
                key={i}
                onClick={() => onRelatedQuery?.(rq)}
                className="flex items-center gap-2 text-left text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary transition-all group"
              >
                <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:text-primary transition-colors" />
                {rq}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function DataPointCard({ dp }: { dp: DataPoint }) {
  const ChangeIcon = dp.changeDirection === 'up' ? TrendingUp
    : dp.changeDirection === 'down' ? TrendingDown : Minus

  return (
    <div className="p-3 rounded-lg border border-border bg-secondary/30 hover:border-primary/20 transition-all">
      <div className="text-[11px] text-muted-foreground mb-1 leading-snug">{dp.label}</div>
      <div className="text-base font-bold text-foreground">{dp.value}</div>
      {dp.change && (
        <div className={cn('flex items-center gap-1 mt-1 text-[11px] font-medium',
          dp.changeDirection === 'up' && 'text-emerald-400',
          dp.changeDirection === 'down' && 'text-destructive',
          dp.changeDirection === 'neutral' && 'text-muted-foreground',
        )}>
          <ChangeIcon className="w-3 h-3" />
          {dp.change}
        </div>
      )}
    </div>
  )
}

function FormattedMarkdown({ text }: { text: string }) {
  // Minimal markdown: **bold**, and paragraph breaks
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  const formatted = parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return <span key={i}>{part}</span>
  })

  return <p className="leading-relaxed">{formatted}</p>
}
