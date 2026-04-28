'use client'

import { Bell, Search } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/query': { title: 'Intelligence Query', subtitle: 'Ask any question about seaweed markets, prices, regulations, or trade' },
  '/dashboard': { title: 'Market Pulse Dashboard', subtitle: 'Real-time seaweed industry intelligence' },
  '/report-bank': { title: 'Report Bank', subtitle: 'Upload and search your document intelligence' },
  '/alerts': { title: 'Regulatory Alerts', subtitle: 'Proactive monitoring of regulatory changes' },
  '/history': { title: 'Query History', subtitle: 'Your past queries and saved searches' },
  '/settings': { title: 'Settings', subtitle: 'Configure your intelligence profile' },
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [quickQuery, setQuickQuery] = useState('')

  const pageKey = Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k)) ?? '/dashboard'
  const { title, subtitle } = PAGE_TITLES[pageKey] ?? { title: 'BlueBonzo AI', subtitle: '' }

  function handleQuickQuery(e: React.FormEvent) {
    e.preventDefault()
    if (quickQuery.trim()) {
      router.push(`/query?q=${encodeURIComponent(quickQuery.trim())}`)
      setQuickQuery('')
    }
  }

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center px-4 gap-4">
      <div className="flex-1">
        <h1 className="text-sm font-semibold leading-none">{title}</h1>
        <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{subtitle}</p>
      </div>

      {/* Quick query bar (only on non-query pages) */}
      {!pathname.startsWith('/query') && (
        <form onSubmit={handleQuickQuery} className="hidden md:flex items-center flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={quickQuery}
              onChange={e => setQuickQuery(e.target.value)}
              placeholder="Quick query..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-secondary border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        </form>
      )}

      <div className="flex items-center gap-2">
        {/* Alert bell */}
        <button
          onClick={() => router.push('/alerts')}
          className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-slow" />
          <span className="text-[10px] text-amber-400 font-medium hidden sm:block">Demo Mode</span>
        </div>
      </div>
    </header>
  )
}
