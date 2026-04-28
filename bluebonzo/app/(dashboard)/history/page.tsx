'use client'

import { useEffect, useState } from 'react'
import { Clock, Bookmark, BookmarkCheck, Search, ArrowRight, Loader2, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HistoryEntry {
  id: string
  query: string
  confidence: string
  processingMs: number
  isSaved: boolean
  savedName?: string
  createdAt: string
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-destructive',
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => { setEntries(d.history ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = entries.filter(e =>
    e.query.toLowerCase().includes(search.toLowerCase()) ||
    (e.savedName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function toggleSaved(entry: HistoryEntry) {
    const nextSaved = !entry.isSaved
    const savedName = nextSaved ? entry.savedName || entry.query.slice(0, 48) : undefined
    setEntries(prev => prev.map(item => item.id === entry.id ? { ...item, isSaved: nextSaved, savedName } : item))
    await fetch('/api/history', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entry.id, isSaved: nextSaved, savedName }),
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Query History</h1>
            <p className="text-sm text-muted-foreground">{entries.length} queries · Session & saved</p>
          </div>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search your queries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-card transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <h2 className="font-semibold text-lg mb-1">No queries yet</h2>
          <p className="text-sm text-muted-foreground mb-4">Your BlueBonzo query history will appear here.</p>
          <a href="/query" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all">
            Ask a question
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => (
            <a
              key={entry.id}
              href={`/query?q=${encodeURIComponent(entry.query)}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-secondary/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                {entry.isSaved
                  ? <BookmarkCheck className="w-4 h-4 text-primary" />
                  : <Clock className="w-4 h-4 text-muted-foreground" />
                }
              </div>
              <div className="flex-1 min-w-0">
                {entry.savedName && (
                  <p className="text-xs text-primary font-medium mb-0.5">{entry.savedName}</p>
                )}
                <p className="text-sm font-medium text-foreground truncate">{entry.query}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('text-xs font-medium capitalize', CONFIDENCE_COLORS[entry.confidence] ?? 'text-muted-foreground')}>
                    {entry.confidence} confidence
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{entry.processingMs}ms</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  toggleSaved(entry)
                }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-all shrink-0"
                title={entry.isSaved ? 'Unsave query' : 'Save query'}
              >
                {entry.isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
