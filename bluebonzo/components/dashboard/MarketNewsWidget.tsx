'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWatchProfileQuery } from '@/components/hooks/useWatchProfileQuery'

interface NewsItem {
  id: number
  title: string
  summary: string
  source: string
  category: string
  sentiment: 'positive' | 'negative' | 'neutral'
  publishedAt: string
  url?: string
}

const SENTIMENT = {
  positive: { icon: TrendingUp, cls: 'text-emerald-400', label: 'Positive' },
  negative: { icon: TrendingDown, cls: 'text-destructive', label: 'Negative' },
  neutral: { icon: Minus, cls: 'text-muted-foreground', label: 'Neutral' },
}

const CATEGORY_COLORS: Record<string, string> = {
  pricing: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  regulatory: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  trade: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sustainability: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  investment: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  research: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
}

export function MarketNewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const profileQuery = useWatchProfileQuery()

  useEffect(() => {
    fetch(`/api/dashboard/news${profileQuery}`)
      .then(r => r.json())
      .then(d => { setNews(d.news ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [profileQuery])

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Market Intelligence Feed</h3>
          <p className="text-xs text-muted-foreground mt-0.5">AI-curated industry news</p>
        </div>
        <a href="/query?q=latest+seaweed+market+news" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
          Query more <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {news.slice(0, 5).map(item => {
            const sent = SENTIMENT[item.sentiment]
            const SentIcon = sent.icon
            const catCls = CATEGORY_COLORS[item.category] ?? 'bg-secondary text-muted-foreground border-border'
            return (
              <div key={item.id} className="px-4 py-3 hover:bg-secondary/30 transition-all group">
                <div className="flex items-start gap-2.5">
                  <SentIcon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', sent.cls)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      {item.url && item.url !== '#' && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{item.summary}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cn('px-1.5 py-0.5 rounded border text-[10px] font-medium capitalize', catCls)}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{item.source}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
