'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { cn, formatCurrency } from '@/lib/utils'
import { useWatchProfileQuery } from '@/components/hooks/useWatchProfileQuery'

const COMMODITY_LABELS: Record<string, string> = {
  carrageenan_src: 'Carrageenan SRC',
  carrageenan_prc: 'Carrageenan PRC',
  agar_food: 'Agar Food Grade',
  agar_tech: 'Agar Technical',
  alginate: 'Sodium Alginate',
  nori: 'Dried Nori',
  spirulina: 'Spirulina',
  chlorella: 'Chlorella',
  kelp_meal: 'Kelp Meal',
}

interface PriceSummary {
  commodity: string
  latestPrice: number
  unit: string
  changePercent: number
  sparkline: { date: string; price: number }[]
}

export function PriceTrackerWidget() {
  const [data, setData] = useState<PriceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const profileQuery = useWatchProfileQuery()

  useEffect(() => {
    fetch(`/api/dashboard/prices${profileQuery}`)
      .then(r => r.json())
      .then(d => { setData(d.summary ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [profileQuery])

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Price Tracker</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Weekly commodity prices · Global average</p>
        </div>
        <div className="text-xs text-muted-foreground">USD/kg</div>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        ) : data.map(item => (
          <div key={item.commodity} className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-all">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{COMMODITY_LABELS[item.commodity] ?? item.commodity}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.unit?.replace('_', ' ')}</div>
            </div>
            {/* Sparkline */}
            <div className="w-16 h-8 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={item.sparkline}>
                  <Line type="monotone" dataKey="price" stroke={item.changePercent >= 0 ? '#10b981' : '#ef4444'} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-right shrink-0 w-20">
              <div className="text-sm font-bold">{formatCurrency(item.latestPrice)}</div>
              <div className={cn('flex items-center justify-end gap-0.5 text-xs font-medium',
                item.changePercent > 0 ? 'text-emerald-400' : item.changePercent < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                {item.changePercent > 0 ? <TrendingUp className="w-3 h-3" /> : item.changePercent < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {Math.abs(item.changePercent).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
