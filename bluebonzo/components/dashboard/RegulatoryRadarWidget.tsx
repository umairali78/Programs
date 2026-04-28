'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWatchProfileQuery } from '@/components/hooks/useWatchProfileQuery'

interface RegAlert {
  id: number
  title: string
  summary: string
  severity: 'high' | 'medium' | 'low' | 'info'
  jurisdiction: string
  createdAt: string
}

const SEVERITY_CONFIG = {
  high: { icon: AlertTriangle, cls: 'text-destructive bg-destructive/10 border-destructive/20', dot: 'bg-destructive', label: 'High' },
  medium: { icon: AlertTriangle, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400', label: 'Medium' },
  low: { icon: Clock, cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400', label: 'Low' },
  info: { icon: CheckCircle, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400', label: 'Info' },
}

export function RegulatoryRadarWidget() {
  const [alerts, setAlerts] = useState<RegAlert[]>([])
  const [loading, setLoading] = useState(true)
  const profileQuery = useWatchProfileQuery()

  useEffect(() => {
    fetch(`/api/alerts${profileQuery}`)
      .then(r => r.json())
      .then(d => { setAlerts(d.alerts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [profileQuery])

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Regulatory Radar</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Active alerts · EU, FDA, Codex</p>
        </div>
        <a href="/alerts" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
          View all <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
          <p className="text-sm text-muted-foreground">No active regulatory alerts</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {alerts.slice(0, 4).map(alert => {
            const cfg = SEVERITY_CONFIG[alert.severity]
            const Icon = cfg.icon
            return (
              <div key={alert.id} className="px-4 py-3 hover:bg-secondary/30 transition-all">
                <div className="flex items-start gap-2.5">
                  <div className={cn('mt-0.5 p-1 rounded-md border shrink-0', cfg.cls)}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium leading-snug">{alert.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{alert.summary}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
                      <span className="text-[10px] text-muted-foreground">{alert.jurisdiction}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
