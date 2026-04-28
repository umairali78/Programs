'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { getCountryFlag, formatCompact } from '@/lib/utils'
import { useWatchProfileQuery } from '@/components/hooks/useWatchProfileQuery'

interface TradeEntry {
  country: string
  iso3: string
  value: number
  change: number
  share: number
}

interface TradeData {
  exporters: TradeEntry[]
  importers: TradeEntry[]
  year: number
  totalValue: number
}

export function TradeFlowWidget() {
  const [data, setData] = useState<TradeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'exporters' | 'importers'>('exporters')
  const profileQuery = useWatchProfileQuery()

  useEffect(() => {
    fetch(`/api/dashboard/trade${profileQuery}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [profileQuery])

  const rows = tab === 'exporters' ? data?.exporters : data?.importers

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Trade Flows</h3>
          <p className="text-xs text-muted-foreground mt-0.5">HS 1212.21/1212.29 · {data?.year ?? '2023'}</p>
        </div>
        <div className="flex rounded-lg bg-secondary p-0.5 text-xs">
          {(['exporters', 'importers'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2.5 py-1 rounded-md capitalize transition-all ${tab === t ? 'bg-card text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={rows?.slice(0, 6).map(r => ({ name: r.iso3, value: r.value / 1e6, flag: getCountryFlag(r.iso3) }))}
                margin={{ top: 4, right: 4, left: -20, bottom: 4 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}M`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(222 44% 9%)', border: '1px solid hsl(217 32% 15%)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`$${Number(v ?? 0).toFixed(1)}M`, 'Value']}
                />
                <Bar dataKey="value" fill="#14b8a6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="divide-y divide-border border-t border-border">
            {rows?.map((entry, i) => (
              <div key={entry.iso3} className="px-4 py-2.5 flex items-center gap-3 hover:bg-secondary/30 transition-all">
                <span className="text-xs text-muted-foreground w-4 shrink-0 font-mono">{i + 1}</span>
                <span className="text-base shrink-0">{getCountryFlag(entry.iso3)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{entry.country}</div>
                  <div className="text-xs text-muted-foreground">{entry.share.toFixed(1)}% global share</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold">${formatCompact(entry.value)}</div>
                  <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${entry.change >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                    {entry.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(entry.change).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
