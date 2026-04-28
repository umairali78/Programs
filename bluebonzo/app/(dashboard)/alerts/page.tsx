'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, Info, Bell, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Alert {
  id: string
  title: string
  summary: string
  severity: 'high' | 'medium' | 'low' | 'info'
  jurisdiction: string
  isRead: boolean
  createdAt: string
}

const SEVERITY_CONFIG = {
  high: { icon: AlertTriangle, label: 'High', cls: 'text-destructive border-destructive/30 bg-destructive/10', dot: 'bg-destructive' },
  medium: { icon: AlertTriangle, label: 'Medium', cls: 'text-amber-400 border-amber-500/30 bg-amber-500/10', dot: 'bg-amber-400' },
  low: { icon: Clock, label: 'Low', cls: 'text-blue-400 border-blue-500/30 bg-blue-500/10', dot: 'bg-blue-400' },
  info: { icon: Info, label: 'Info', cls: 'text-muted-foreground border-border bg-secondary/50', dot: 'bg-muted-foreground' },
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all')

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => r.json())
      .then(d => { setAlerts(d.alerts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function markRead(id: string) {
    await fetch('/api/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isRead: true }) })
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a))
  }

  const filtered = alerts.filter(a => {
    if (filter === 'unread') return !a.isRead
    if (filter === 'high') return a.severity === 'high'
    return true
  })

  const unreadCount = alerts.filter(a => !a.isRead).length

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Regulatory Alerts</h1>
            <p className="text-sm text-muted-foreground">{unreadCount} unread · EU, FDA, Codex, WTO</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex rounded-lg bg-secondary p-0.5 text-xs">
            {(['all', 'unread', 'high'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md capitalize transition-all ${filter === f ? 'bg-card text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-secondary/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
          <h2 className="font-semibold text-lg mb-1">All clear</h2>
          <p className="text-sm text-muted-foreground">No {filter !== 'all' ? filter + ' ' : ''}alerts at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const cfg = SEVERITY_CONFIG[alert.severity]
            const Icon = cfg.icon
            return (
              <div
                key={alert.id}
                className={cn('rounded-xl border p-4 transition-all', cfg.cls, !alert.isRead && 'shadow-sm')}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{alert.title}</h3>
                          {!alert.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.jurisdiction} · {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      {!alert.isRead && (
                        <button
                          onClick={() => markRead(alert.id)}
                          className="shrink-0 text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-sm mt-2 leading-relaxed opacity-90">{alert.summary}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <a
                        href={`/query?q=${encodeURIComponent(alert.title)}`}
                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Query BlueBonzo for details →
                      </a>
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
