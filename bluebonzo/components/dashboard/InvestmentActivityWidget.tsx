'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { useWatchProfileQuery } from '@/components/hooks/useWatchProfileQuery'

const DEMO_INVESTMENTS = [
  { company: 'Running Tide', country: 'US', round: 'Series B', amount: 43, currency: 'M', focus: 'Carbon kelp farming', date: 'Mar 2024', sector: 'farming' },
  { company: 'Notpla', country: 'UK', round: 'Series A', amount: 11, currency: 'M', focus: 'Seaweed packaging', date: 'Jan 2024', sector: 'biotech' },
  { company: 'Blue Evolution', country: 'US', round: 'Seed+', amount: 5.2, currency: 'M', focus: 'Regenerative seaweed', date: 'Nov 2023', sector: 'farming' },
  { company: 'Alg&You', country: 'FR', round: 'Series A', amount: 8, currency: 'M', focus: 'Seaweed nutraceuticals', date: 'Sep 2023', sector: 'biotech' },
  { company: 'Seakura', country: 'IL', round: 'Seed', amount: 2.5, currency: 'M', focus: 'Land-based farming', date: 'Jul 2023', sector: 'farming' },
]

const SECTOR_COLORS: Record<string, string> = {
  farming: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  biotech: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  tech: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
}

export function InvestmentActivityWidget() {
  const [investments, setInvestments] = useState(DEMO_INVESTMENTS)
  const profileQuery = useWatchProfileQuery()

  useEffect(() => {
    fetch(`/api/dashboard/investments${profileQuery}`)
      .then(r => r.json())
      .then(d => setInvestments(d.investments ?? DEMO_INVESTMENTS))
      .catch(() => {})
  }, [profileQuery])

  const totalH2 = investments.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Investment Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Recent funding rounds · Demo data</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 font-medium">${totalH2.toFixed(1)}M</span>
          <span>H2 2023–H1 2024</span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {investments.map((inv, i) => {
          const sectorCls = SECTOR_COLORS[inv.sector] ?? 'bg-secondary text-muted-foreground border-border'
          return (
            <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-secondary/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{inv.company}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium capitalize ${sectorCls}`}>
                    {inv.sector}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{inv.country}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{inv.focus}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-medium text-foreground">{inv.round}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-bold text-emerald-400">${inv.amount}{inv.currency}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" /> {inv.date}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
