import { PriceTrackerWidget } from '@/components/dashboard/PriceTrackerWidget'
import { TradeFlowWidget } from '@/components/dashboard/TradeFlowWidget'
import { RegulatoryRadarWidget } from '@/components/dashboard/RegulatoryRadarWidget'
import { MarketNewsWidget } from '@/components/dashboard/MarketNewsWidget'
import { InvestmentActivityWidget } from '@/components/dashboard/InvestmentActivityWidget'
import { ReportBankHighlightsWidget } from '@/components/dashboard/ReportBankHighlightsWidget'
import { Waves } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Hero stat bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Carrageenan SRC', value: '$2.35/kg', change: '-8.2%', up: false },
          { label: 'Sodium Alginate', value: '$4.80/kg', change: '+2.1%', up: true },
          { label: 'Global Seaweed Market', value: '$9.1B', change: '+7.4% YoY', up: true },
          { label: 'Active Regulatory Alerts', value: '5', change: '2 high priority', up: false },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className={`text-xs font-medium mt-1 ${stat.up ? 'text-emerald-400' : 'text-destructive'}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Market Intelligence Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Waves className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Market Pulse — Week of Apr 28, 2024</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Carrageenan prices remain under pressure from Indonesian supply glut. EU arsenic limits tightening in Q3. Chinese exports up 12% YTD.
          </p>
        </div>
        <a href="/query?q=Weekly+market+summary+for+seaweed+commodities" className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all">
          Deep Dive →
        </a>
      </div>

      {/* Main widget grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PriceTrackerWidget />
        <TradeFlowWidget />
        <RegulatoryRadarWidget />
        <MarketNewsWidget />
        <InvestmentActivityWidget />
        <ReportBankHighlightsWidget />
      </div>
    </div>
  )
}
