'use client'

import { useEffect, useState } from 'react'
import { FileText, Upload, Eye, Download, Clock } from 'lucide-react'
import Link from 'next/link'
import { useWatchProfileQuery } from '@/components/hooks/useWatchProfileQuery'

const DEMO_REPORTS = [
  { name: 'Global Carrageenan Market Outlook 2024', pages: 48, tags: ['carrageenan', 'market-sizing'], addedDaysAgo: 2, category: 'Market Research' },
  { name: 'EU Seaweed Regulatory Landscape — Q1 2024', pages: 22, tags: ['regulatory', 'EU'], addedDaysAgo: 5, category: 'Regulatory' },
  { name: 'Philippines Seaweed Export Analysis', pages: 35, tags: ['trade', 'philippines', 'exports'], addedDaysAgo: 8, category: 'Trade Data' },
  { name: 'Hydrocolloid Pricing Trends 2020–2024', pages: 18, tags: ['pricing', 'agar', 'alginate'], addedDaysAgo: 12, category: 'Pricing' },
  { name: 'Sustainable Seaweed Aquaculture Standards', pages: 61, tags: ['sustainability', 'certification'], addedDaysAgo: 18, category: 'Standards' },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Market Research': 'bg-teal-500/10 text-teal-400',
  'Regulatory': 'bg-amber-500/10 text-amber-400',
  'Trade Data': 'bg-blue-500/10 text-blue-400',
  'Pricing': 'bg-emerald-500/10 text-emerald-400',
  'Standards': 'bg-purple-500/10 text-purple-400',
}

export function ReportBankHighlightsWidget() {
  const [reports, setReports] = useState(DEMO_REPORTS)
  const profileQuery = useWatchProfileQuery()

  useEffect(() => {
    fetch(`/api/dashboard/report-bank${profileQuery}`)
      .then(r => r.json())
      .then(d => setReports(d.reports ?? DEMO_REPORTS))
      .catch(() => {})
  }, [profileQuery])

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Report Bank</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Knowledge base · {reports.length} documents</p>
        </div>
        <Link
          href="/report-bank"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
        >
          <Upload className="w-3 h-3" />
          Upload
        </Link>
      </div>

      <div className="divide-y divide-border">
        {reports.map((report, i) => {
          const catCls = CATEGORY_COLORS[report.category] ?? 'bg-secondary text-muted-foreground'
          return (
            <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-secondary/30 transition-all group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5 border border-border group-hover:border-primary/30 transition-colors">
                <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-1">{report.name}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${catCls}`}>{report.category}</span>
                  <span className="text-[10px] text-muted-foreground">{report.pages}pp</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    {report.addedDaysAgo}d ago
                  </span>
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {report.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-1 py-0.5 rounded bg-secondary border border-border text-[10px] text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all" title="Preview">
                  <Eye className="w-3 h-3" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all" title="Download">
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-3 border-t border-border">
        <Link
          href="/report-bank"
          className="block w-full text-center text-xs text-primary hover:text-primary/80 transition-colors py-1"
        >
          View all documents →
        </Link>
      </div>
    </div>
  )
}
