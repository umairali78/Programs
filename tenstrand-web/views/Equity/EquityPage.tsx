'use client'
import { useEffect, useState } from 'react'
import {
  AlertTriangle, BarChart2, BookOpen, ChevronDown, ChevronRight,
  Filter, Loader2, MapPin, TrendingUp
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'

interface EquityRow {
  county: string
  programs: number
  partners: number
  schools: number
  enrollment: number
  title1Pct: number
  programsPerSchool: number
  burden: number
  isRural: boolean
  priority: number
}

type TierFilter = 'all' | 'critical' | 'high' | 'medium' | 'low'

function tierInfo(priority: number) {
  if (priority >= 65) return { label: 'Critical', textColor: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', bar: '#dc2626' }
  if (priority >= 45) return { label: 'High',     textColor: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', bar: '#ea580c' }
  if (priority >= 25) return { label: 'Medium',   textColor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', bar: '#d97706' }
  return                     { label: 'Low',      textColor: 'text-green-700', bg: 'bg-green-50', border: 'border-green-100', bar: '#16a34a' }
}

function calcComponents(row: EquityRow) {
  const coverageGap = Math.max(0, 100 - row.programsPerSchool * 50)
  return {
    burdenContrib: parseFloat((row.burden * 0.35).toFixed(1)),
    title1Contrib: parseFloat((row.title1Pct * 0.30).toFixed(1)),
    gapContrib:    parseFloat((coverageGap * 0.25).toFixed(1)),
    ruralContrib:  row.isRural ? 10 : 0,
    coverageGap:   Math.round(coverageGap),
  }
}

export function EquityPage() {
  const [data, setData] = useState<EquityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    invoke<EquityRow[]>('insights:equityCoverage')
      .then(setData)
      .catch(() => toast.error('Failed to load equity data'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = data.filter((row) => {
    if (search && !row.county.toLowerCase().includes(search.toLowerCase())) return false
    if (tierFilter === 'critical') return row.priority >= 65
    if (tierFilter === 'high')     return row.priority >= 45 && row.priority < 65
    if (tierFilter === 'medium')   return row.priority >= 25 && row.priority < 45
    if (tierFilter === 'low')      return row.priority < 25
    return true
  })

  const stats = {
    total:        data.length,
    critical:     data.filter(r => r.priority >= 65).length,
    zeroCoverage: data.filter(r => r.programs === 0).length,
    avgBurden:    data.length ? Math.round(data.reduce((s, r) => s + r.burden, 0) / data.length) : 0,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Equity & Coverage Mapper" />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-5">

        {/* ── Formula card ───────────────────────────────────────────────── */}
        <div className="bg-white border border-app-border rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-brand to-[#0d4a28] px-5 py-4 text-white">
            <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />Priority Score Formula
            </h2>
            <p className="text-xs text-white/70 leading-relaxed">
              Counties are ranked to identify where new Climate-Based Partner (CBP) organizations are needed most urgently.
              Click any county row below to see its exact score breakdown.
            </p>
          </div>

          <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                weight: '35%', label: 'Environmental Burden',
                color: 'text-red-700 bg-red-50 border-red-200',
                desc: 'CalEnviroScreen index (0–100, public OEHHA data). Communities facing the greatest pollution + health burden score highest. Kern, Imperial, Fresno counties have the highest burden statewide.',
              },
              {
                weight: '30%', label: 'Title I School %',
                color: 'text-orange-700 bg-orange-50 border-orange-200',
                desc: 'Share of a county\'s schools receiving Title I federal funding — the primary proxy for concentrations of low-income students who most need access to free climate education programs.',
              },
              {
                weight: '25%', label: 'Coverage Gap',
                color: 'text-amber-700 bg-amber-50 border-amber-200',
                desc: 'Inverse of the programs-per-school ratio. A county with 0 programs and 30 schools scores 100 on this dimension. Computed as: max(0, 100 − programsPerSchool × 50).',
              },
              {
                weight: '10%', label: 'Rural Bonus',
                color: 'text-blue-700 bg-blue-50 border-blue-200',
                desc: 'Fixed +10 points for rural counties (Alpine, Trinity, Modoc, Plumas, etc.) where geographic distance structurally prevents teachers from accessing urban CBP programs.',
              },
            ].map(({ weight, label, color, desc }) => (
              <div key={label} className={`rounded-xl border p-3 ${color}`}>
                <p className="text-3xl font-black mb-1">{weight}</p>
                <p className="text-xs font-semibold mb-1.5">{label}</p>
                <p className="text-[10px] leading-snug opacity-80">{desc}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-app-border px-5 py-3 bg-gray-50">
            <p className="text-[10px] text-gray-400">
              Scores range 0–100+. Thresholds: Critical ≥65 · High 45–64 · Medium 25–44 · Low &lt;25. Click any county row to see its exact breakdown.
            </p>
          </div>
        </div>

        {/* ── Summary stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Counties Tracked',  value: stats.total,        sub: 'across California',         Icon: MapPin,       color: 'text-brand' },
            { label: 'Critical Priority', value: stats.critical,     sub: 'need urgent CBP partners',  Icon: AlertTriangle, color: 'text-red-500' },
            { label: 'Zero Coverage',     value: stats.zeroCoverage, sub: 'counties with no programs', Icon: BookOpen,     color: 'text-orange-500' },
            { label: 'Avg Env Burden',    value: stats.avgBurden,    sub: 'CalEnviroScreen avg score', Icon: BarChart2,    color: 'text-purple-500' },
          ].map(({ label, value, sub, Icon, color }) => (
            <div key={label} className="bg-white border border-app-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-app-border rounded-xl px-3 py-2 flex-1 max-w-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by county name…"
              className="bg-transparent text-xs outline-none flex-1"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([
              ['all',      'All Counties'],
              ['critical', 'Critical ≥65'],
              ['high',     'High 45–64'],
              ['medium',   'Medium 25–44'],
              ['low',      'Low <25'],
            ] as const).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  tierFilter === t
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── County table ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No counties match your filter</p>
          </div>
        ) : (
          <div className="bg-white border border-app-border rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 border-b border-app-border text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              <span className="col-span-3">County</span>
              <span className="col-span-1 text-right">Programs</span>
              <span className="col-span-1 text-right">Schools</span>
              <span className="col-span-1 text-right">Title I%</span>
              <span className="col-span-1 text-right">Burden</span>
              <span className="col-span-1 text-center">Rural</span>
              <span className="col-span-4">Priority</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {filtered.map((row) => {
                const tier = tierInfo(row.priority)
                const isOpen = expanded === row.county
                const comps = calcComponents(row)

                return (
                  <div key={row.county}>
                    {/* Main row */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : row.county)}
                      className="w-full grid grid-cols-12 gap-2 px-4 py-3 items-center text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        {isOpen
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${tier.textColor} ${tier.bg} ${tier.border}`}>
                          {tier.label}
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate">{row.county}</span>
                        {row.isRural && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full shrink-0">Rural</span>
                        )}
                      </div>
                      <span className="col-span-1 text-right text-xs text-gray-600">{row.programs}</span>
                      <span className="col-span-1 text-right text-xs text-gray-600">{row.schools}</span>
                      <span className="col-span-1 text-right text-xs text-gray-600">{row.title1Pct}%</span>
                      <span className="col-span-1 text-right text-xs text-gray-600">{row.burden}</span>
                      <span className="col-span-1 text-center text-xs text-gray-400">{row.isRural ? '✓' : '—'}</span>
                      <div className="col-span-4 flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, row.priority)}%`, backgroundColor: tier.bar }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-6 text-right">{row.priority}</span>
                      </div>
                    </button>

                    {/* Expanded breakdown */}
                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                        <p className="text-xs font-semibold text-gray-700 mb-3">
                          Priority Score Breakdown — {row.county} County
                        </p>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                          {[
                            {
                              label: 'Env. Burden',
                              contrib: comps.burdenContrib,
                              max: 35,
                              rawLabel: `Score ${row.burden}/100`,
                              formula: `${row.burden} × 0.35`,
                              barColor: 'bg-red-400',
                            },
                            {
                              label: 'Title I Schools',
                              contrib: comps.title1Contrib,
                              max: 30,
                              rawLabel: `${row.title1Pct}% are Title I`,
                              formula: `${row.title1Pct} × 0.30`,
                              barColor: 'bg-orange-400',
                            },
                            {
                              label: 'Coverage Gap',
                              contrib: comps.gapContrib,
                              max: 25,
                              rawLabel: `${row.programsPerSchool} prog/school → gap ${comps.coverageGap}`,
                              formula: `${comps.coverageGap} × 0.25`,
                              barColor: 'bg-amber-400',
                            },
                            {
                              label: 'Rural Bonus',
                              contrib: comps.ruralContrib,
                              max: 10,
                              rawLabel: row.isRural ? 'Rural county' : 'Not rural',
                              formula: row.isRural ? '+10 fixed' : '0 (not rural)',
                              barColor: 'bg-blue-400',
                            },
                          ].map(({ label, contrib, max, rawLabel, formula, barColor }) => (
                            <div key={label} className="bg-white rounded-xl border border-gray-200 p-3">
                              <div className="flex items-baseline justify-between mb-1">
                                <span className="text-[10px] text-gray-500">{label}</span>
                                <span className="text-sm font-bold text-gray-800">{contrib} pts</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                                <div
                                  className={`h-full rounded-full ${barColor}`}
                                  style={{ width: `${(contrib / max) * 100}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-gray-500 font-mono mb-0.5">{formula}</p>
                              <p className="text-[10px] text-gray-400">{rawLabel}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-gray-500 font-mono">
                            {comps.burdenContrib} + {comps.title1Contrib} + {comps.gapContrib} + {comps.ruralContrib}
                            {' = '}<strong className="text-gray-700">{row.priority} priority score</strong>
                            {' ('}tier: <span className={`font-semibold ${tier.textColor}`}>{tier.label}</span>{')'}
                          </p>
                          <div className="flex gap-3 text-[10px] text-gray-400">
                            <span>Enrollment: {row.enrollment.toLocaleString()}</span>
                            <span>{row.partners} partner{row.partners !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {row.programs === 0 && (
                          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            No active programs in {row.county} County — this is a partner desert.
                            Use the <strong>Prospector</strong> to find organizations to target here.
                          </div>
                        )}
                        {row.programs > 0 && row.priority >= 65 && (
                          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-700">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            {row.programs} program{row.programs !== 1 ? 's exist' : ' exists'} but coverage is still critically low relative to school count and community need.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
