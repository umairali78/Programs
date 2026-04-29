'use client'
import { useEffect, useState } from 'react'
import {
  AlertCircle, ArrowRight, Building2, CheckCircle2, ChevronDown, ChevronRight, Copy,
  ExternalLink, Filter, Globe, Loader2, Mail, MapPin, Pencil, Plus, RefreshCw,
  Search, Sparkles, Star, Tag, Trash2, X,
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app.store'

type ProspectStatus = 'new' | 'contacted' | 'responded' | 'enrolled' | 'declined'

interface Prospect {
  id: string; name: string; type: string | null; source_url: string | null
  county: string | null; notes: string | null; status: ProspectStatus
  ai_score: number | null; outreach_count: number; created_at: number
}
interface OutreachEntry {
  id: string; email_subject: string; email_body: string; sent_at: number; response_status: string
}
interface AISuggestion {
  name: string; type: string; county: string; rationale: string
  scoreEstimate: number; sourceHint: string
}
interface EquityRow {
  county: string; programs: number; schools: number; title1Pct: number
  burden: number; isRural: boolean; priority: number
  partners: number; enrollment: number; programsPerSchool: number
}

const STATUS_COLORS: Record<ProspectStatus, string> = {
  new:       'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-50 text-blue-700',
  responded: 'bg-amber-50 text-amber-700',
  enrolled:  'bg-green-50 text-green-700',
  declined:  'bg-red-50 text-red-600',
}
const STATUSES: ProspectStatus[] = ['new', 'contacted', 'responded', 'enrolled', 'declined']

// ── Add Prospect Modal ──────────────────────────────────────────────────────
function AddProspectModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [county, setCounty] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      await invoke('prospect:create', { name: name.trim(), type: type || undefined, county: county || undefined, sourceUrl: sourceUrl || undefined, notes: notes || undefined })
      toast.success('Prospect added')
      onSaved()
    } catch { toast.error('Failed to add prospect') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <h2 className="text-sm font-semibold text-gray-900">Add Prospect</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Organization Name *</label><input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Elk Ridge Nature Center" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inp}>
              <option value="">Select type…</option>
              {['wetlands','agriculture','urban_ecology','climate_justice','indigenous_knowledge','general'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">County</label><input value={county} onChange={(e) => setCounty(e.target.value)} className={inp} placeholder="Sonoma" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Source URL</label><input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className={inp} placeholder="https://…" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inp} /></div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-app-border">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Add Prospect
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Outreach Modal ──────────────────────────────────────────────────────────
function OutreachModal({ prospect, onClose }: { prospect: Prospect; onClose: () => void }) {
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)
  const [generating, setGenerating] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [logging, setLogging] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await invoke<{ subject: string; body: string } | null>('prospect:generateOutreach', { prospectId: prospect.id })
      if (result) { setSubject(result.subject); setBody(result.body) }
      else toast.error('AI unavailable — add API key in Settings')
    } catch { toast.error('Generation failed') }
    finally { setGenerating(false) }
  }

  const handleLog = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Write or generate email first'); return }
    setLogging(true)
    try {
      await invoke('prospect:logOutreach', { prospectId: prospect.id, subject, body })
      toast.success('Outreach logged and status updated to Contacted')
      onClose()
    } catch { toast.error('Failed to log outreach') }
    finally { setLogging(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Outreach Email</h2>
            <p className="text-xs text-gray-500 mt-0.5">{prospect.name} · {prospect.county}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {hasClaudeKey && (
            <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors disabled:opacity-50">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}Generate with AI
            </button>
          )}
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} className={inp} placeholder="Invitation to join the Climate Learning Exchange" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Body</label><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className={inp} /></div>
        </div>
        <div className="flex justify-between items-center p-4 border-t border-app-border">
          <button onClick={() => { navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); toast.success('Copied') }} className="flex items-center gap-1.5 px-3 py-2 text-gray-600 text-xs hover:bg-gray-100 rounded-lg">
            <Copy className="w-3.5 h-3.5" />Copy
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleLog} disabled={logging} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50">
              {logging && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Mark as Sent
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export function ProspectorPage() {
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)
  const [tab, setTab] = useState<'pipeline' | 'discover'>('pipeline')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [outreachTarget, setOutreachTarget] = useState<Prospect | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | 'all'>('all')
  const [filterCounty, setFilterCounty] = useState('')
  const [outreachLogs, setOutreachLogs] = useState<Record<string, OutreachEntry[]>>({})
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')
  // AI Discover
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [discovering, setDiscovering] = useState(false)
  const [equityData, setEquityData] = useState<EquityRow[]>([])
  // URL scraper
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapedOrg, setScrapedOrg] = useState<{ name: string; type: string; county: string; description: string; contactEmail: string; website: string } | null>(null)
  const [scrapeSaved, setScrapeSaved] = useState(false)

  const load = () => {
    setLoading(true)
    invoke<Prospect[]>('prospect:list')
      .then(setProspects)
      .catch(() => toast.error('Failed to load prospects'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    invoke<EquityRow[]>('insights:equityCoverage').then(setEquityData).catch(() => {})
  }, [])

  const handleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); setEditingNotes(null); return }
    setExpanded(id)
    if (!outreachLogs[id]) {
      try {
        const logs = await invoke<OutreachEntry[]>('prospect:listOutreach', { prospectId: id })
        setOutreachLogs(prev => ({ ...prev, [id]: logs }))
      } catch {}
    }
  }

  const handleSaveNotes = async (id: string) => {
    try {
      await invoke('prospect:update', { id, updates: { notes: notesText } })
      setProspects(prev => prev.map(p => p.id === id ? { ...p, notes: notesText } : p))
      setEditingNotes(null)
      toast.success('Notes saved')
    } catch { toast.error('Failed to save notes') }
  }

  const handleDiscover = async () => {
    if (!hasClaudeKey) { toast.error('Add an API key in Settings to use AI Discovery'); return }
    setDiscovering(true); setSuggestions([])
    try {
      const gaps = equityData.slice(0, 8)
      const results = await invoke<AISuggestion[]>('prospect:discover', { coverageGaps: gaps })
      setSuggestions(results ?? [])
      if (!results?.length) toast.error('AI returned no suggestions — try again')
    } catch { toast.error('Discovery failed') }
    finally { setDiscovering(false) }
  }

  const handleAddSuggestion = async (s: AISuggestion) => {
    try {
      await invoke('prospect:create', { name: s.name, type: s.type, county: s.county, notes: `AI suggested: ${s.rationale}\nSource hint: ${s.sourceHint}` })
      toast.success(`${s.name} added to pipeline`)
      load()
    } catch { toast.error('Failed to add') }
  }

  const handleScrape = async () => {
    const url = scrapeUrl.trim()
    if (!url) { toast.error('Enter a URL to scrape'); return }
    setScraping(true); setScrapedOrg(null); setScrapeSaved(false)
    try {
      const result = await invoke<{ name: string; type: string; county: string; description: string; contactEmail: string; website: string } | null>(
        'prospect:scrapeUrl', { url }
      )
      if (result) setScrapedOrg(result)
      else toast.error('Could not extract org info — try a different URL')
    } catch { toast.error('Scrape failed — check the URL or API key') }
    finally { setScraping(false) }
  }

  const handleSaveScraped = async () => {
    if (!scrapedOrg) return
    try {
      await invoke('prospect:create', {
        name: scrapedOrg.name,
        type: scrapedOrg.type || undefined,
        county: scrapedOrg.county || undefined,
        sourceUrl: scrapedOrg.website,
        notes: scrapedOrg.description,
      })
      toast.success(`${scrapedOrg.name} added to pipeline`)
      setScrapeSaved(true)
      load()
    } catch { toast.error('Failed to save') }
  }

  const handleScore = async (id: string) => {
    if (!hasClaudeKey) { toast.error('Add an API key in Settings'); return }
    try {
      const score = await invoke<number | null>('prospect:score', { prospectId: id })
      if (score == null) { toast.error('AI scoring unavailable'); return }
      await invoke('prospect:update', { id, updates: { aiScore: score } })
      toast.success(`AI score: ${score}/10`); load()
    } catch { toast.error('Scoring failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prospect?')) return
    try { await invoke('prospect:delete', { id }); load() } catch { toast.error('Failed to delete') }
  }

  // ── Pipeline filtering ────────────────────────────────────────────────
  const filtered = prospects.filter((p) => {
    const q = query.trim().toLowerCase()
    if (q && ![p.name, p.county, p.type].some(v => v?.toLowerCase().includes(q))) return false
    if (filterCounty && !p.county?.toLowerCase().includes(filterCounty.toLowerCase())) return false
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    return true
  })

  const byStatus = (s: ProspectStatus) => prospects.filter(p => p.status === s)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Intelligent Prospector">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors">
          <Plus className="w-3.5 h-3.5" />Add Prospect
        </button>
      </TopBar>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-app-border bg-white px-6">
        {([['pipeline', 'Pipeline', Building2], ['discover', 'AI Discover', Sparkles]] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${tab === t ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">

        {/* ══ PIPELINE TAB ═══════════════════════════════════════════════ */}
        {tab === 'pipeline' && (
          <>
            {/* Funnel stats */}
            <div className="bg-white border border-app-border rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Conversion Funnel</p>
              <div className="flex items-center gap-0.5">
                {STATUSES.map((s, i) => {
                  const count = byStatus(s).length
                  const isLast = i === STATUSES.length - 1
                  return (
                    <div key={s} className="flex items-center gap-0.5 flex-1 min-w-0">
                      <button
                        onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
                        className={`flex-1 rounded-lg p-2.5 text-center transition-all border ${
                          filterStatus === s
                            ? 'ring-2 ring-brand'
                            : 'hover:bg-gray-50'
                        } ${STATUS_COLORS[s]}`}
                      >
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-[10px] font-medium capitalize">{s}</p>
                      </button>
                      {!isLast && <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />}
                    </div>
                  )
                })}
              </div>
              {filterStatus !== 'all' && (
                <button onClick={() => setFilterStatus('all')} className="mt-2 text-[10px] text-brand hover:underline">
                  Clear filter — show all
                </button>
              )}
            </div>

            {/* Search & filters */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-white border border-app-border rounded-xl px-3 py-2 flex-1">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, county, type…" className="bg-transparent outline-none text-sm flex-1" />
                {query && <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>}
              </div>
              <div className="flex items-center gap-2 bg-white border border-app-border rounded-xl px-3 py-2 w-40">
                <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input value={filterCounty} onChange={(e) => setFilterCounty(e.target.value)} placeholder="County…" className="bg-transparent outline-none text-xs flex-1" />
              </div>
            </div>

            {/* Prospect list */}
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No prospects match your filters</p>
                <p className="text-xs mt-1">Add manually or use AI Discover to find organizations by county gap</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((p) => {
                  const isOpen = expanded === p.id
                  const logs = outreachLogs[p.id] ?? []
                  const isEditingNotes = editingNotes === p.id

                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-app-border">
                      {/* Row header */}
                      <div className="flex items-center gap-3 p-3.5">
                        <button onClick={() => handleExpand(p.id)} className="text-gray-300 hover:text-gray-500 shrink-0 transition-colors">
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                            {p.ai_score != null && (
                              <span className="flex items-center gap-0.5 text-[10px] text-amber-600 shrink-0">
                                <Star className="w-3 h-3 fill-amber-400" />{p.ai_score}/10
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                            {p.county && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.county}</span>}
                            {p.type && <span className="flex items-center gap-0.5"><Tag className="w-3 h-3" />{p.type.replace(/_/g, ' ')}</span>}
                            {p.outreach_count > 0 && <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" />{p.outreach_count} sent</span>}
                            <span className="text-gray-300">Added {new Date(p.created_at * 1000).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <select
                            value={p.status}
                            onChange={async (e) => { await invoke('prospect:update', { id: p.id, updates: { status: e.target.value } }); load() }}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand"
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => setOutreachTarget(p)} title="Compose outreach email" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"><Mail className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleScore(p.id)} title="AI score this prospect" className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-300 hover:text-amber-500 transition-colors"><Sparkles className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div className="border-t border-gray-100">
                          <div className="p-4 space-y-4">

                            {/* Source URL */}
                            {p.source_url && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline truncate">{p.source_url}</a>
                              </div>
                            )}

                            {/* Notes */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs font-semibold text-gray-700">Notes</p>
                                {!isEditingNotes && (
                                  <button
                                    onClick={() => { setEditingNotes(p.id); setNotesText(p.notes ?? '') }}
                                    className="flex items-center gap-1 text-[10px] text-brand hover:underline"
                                  >
                                    <Pencil className="w-3 h-3" />Edit
                                  </button>
                                )}
                              </div>
                              {isEditingNotes ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={notesText}
                                    onChange={(e) => setNotesText(e.target.value)}
                                    rows={3}
                                    className="w-full text-xs border border-app-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                                    placeholder="Add notes about this organization…"
                                  />
                                  <div className="flex gap-2">
                                    <button onClick={() => handleSaveNotes(p.id)} className="px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark">Save</button>
                                    <button onClick={() => setEditingNotes(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  {p.notes || <span className="text-gray-300 italic">No notes yet — click Edit to add</span>}
                                </p>
                              )}
                            </div>

                            {/* Outreach history */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-700">Outreach History</p>
                                <button
                                  onClick={() => setOutreachTarget(p)}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 bg-brand/10 text-brand rounded-lg hover:bg-brand/20 font-medium"
                                >
                                  <Mail className="w-3 h-3" />Compose
                                </button>
                              </div>
                              {logs.length === 0 ? (
                                <p className="text-xs text-gray-300 italic">No outreach sent yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {logs.map((log) => (
                                    <div key={log.id} className="bg-gray-50 rounded-lg border border-gray-100 p-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-gray-800 truncate">{log.email_subject}</p>
                                        <span className="text-[10px] text-gray-400 ml-2 shrink-0">
                                          {new Date(log.sent_at * 1000).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{log.email_body}</p>
                                      <span className={`text-[10px] mt-1.5 inline-block px-1.5 py-0.5 rounded-full font-medium ${
                                        log.response_status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                                      }`}>
                                        {log.response_status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ══ DISCOVER TAB ═══════════════════════════════════════════════ */}
        {tab === 'discover' && (
          <div className="max-w-3xl space-y-5">

            {/* Hero + discover button */}
            <div className="bg-gradient-to-br from-brand to-[#0d4a28] rounded-2xl p-5 text-white">
              <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />AI Prospect Discovery
              </h2>
              <p className="text-xs text-white/70 mb-4 leading-relaxed">
                AI analyzes county coverage gaps and equity data to suggest specific organizations to target —
                nonprofits, state parks, county ag programs, university extensions, and more.
                Top 8 highest-priority counties (ranked by burden × equity × coverage gap) are used as input.
              </p>
              <button
                onClick={handleDiscover}
                disabled={discovering}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg border border-white/30 transition-colors disabled:opacity-50"
              >
                {discovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {discovering ? 'Analyzing coverage gaps…' : 'Discover Prospects by Coverage Gap'}
              </button>
            </div>

            {/* Priority county breakdown table */}
            {equityData.length > 0 && (
              <div className="bg-white border border-app-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-app-border">
                  <p className="text-xs font-semibold text-gray-700">Top 8 Priority Counties — Score Breakdown</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Each score = (burden × 35%) + (Title I% × 30%) + (gap × 25%) + (rural +10)</p>
                </div>
                {equityData.slice(0, 8).map((row, i) => {
                  const coverageGap = Math.max(0, 100 - row.programsPerSchool * 50)
                  const burdenC = parseFloat((row.burden * 0.35).toFixed(1))
                  const title1C = parseFloat((row.title1Pct * 0.30).toFixed(1))
                  const gapC    = parseFloat((coverageGap * 0.25).toFixed(1))
                  const ruralC  = row.isRural ? 10 : 0
                  return (
                    <div key={row.county} className="px-4 py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-brand w-5">#{i + 1}</span>
                        <span className="text-xs font-semibold text-gray-900">{row.county} County</span>
                        {row.isRural && <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full">Rural</span>}
                        <span className="ml-auto text-xs font-bold text-brand">{row.priority} pts</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: 'Burden', value: burdenC, raw: `${row.burden}/100`, color: 'bg-red-100 text-red-700' },
                          { label: 'Title I', value: title1C, raw: `${row.title1Pct}%`, color: 'bg-orange-100 text-orange-700' },
                          { label: 'Gap', value: gapC, raw: `${Math.round(coverageGap)}%`, color: 'bg-amber-100 text-amber-700' },
                          { label: 'Rural', value: ruralC, raw: row.isRural ? '+10' : '—', color: 'bg-blue-50 text-blue-700' },
                        ].map(({ label, value, raw, color }) => (
                          <div key={label} className={`rounded-lg px-2 py-1.5 text-center ${color}`}>
                            <p className="text-[9px] font-medium opacity-70">{label}</p>
                            <p className="text-sm font-bold">{value}</p>
                            <p className="text-[9px] opacity-60">{raw}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-gray-400">
                        <span>{row.programs} programs · {row.schools} schools · {row.partners} partners</span>
                        <a
                          href={`https://www.google.com/search?q=environmental+education+nonprofit+"${encodeURIComponent(row.county + ' County')}"+California`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-brand hover:underline ml-auto"
                        >
                          <Search className="w-3 h-3" />Search orgs
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* URL Scraper */}
            <div className="bg-white border border-app-border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-app-border">
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-brand" />Paste & Scrape — Extract org info from any website
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Paste an org's website URL and AI will extract their name, county, type, and contact info.
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={scrapeUrl}
                    onChange={(e) => { setScrapeUrl(e.target.value); setScrapedOrg(null); setScrapeSaved(false) }}
                    placeholder="https://example-org.org"
                    className="flex-1 text-xs border border-app-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleScrape() }}
                  />
                  <button
                    onClick={handleScrape}
                    disabled={scraping || !scrapeUrl.trim() || !hasClaudeKey}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
                  >
                    {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    {scraping ? 'Scraping…' : 'Extract'}
                  </button>
                </div>

                {scrapedOrg && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-800">{scrapedOrg.name}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500">
                      <span><strong>Type:</strong> {scrapedOrg.type?.replace(/_/g, ' ') || '—'}</span>
                      <span><strong>County:</strong> {scrapedOrg.county || '—'}</span>
                      <span className="col-span-2"><strong>Email:</strong> {scrapedOrg.contactEmail || '—'}</span>
                      <span className="col-span-2 leading-relaxed"><strong>About:</strong> {scrapedOrg.description}</span>
                    </div>
                    <button
                      onClick={handleSaveScraped}
                      disabled={scrapeSaved}
                      className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${scrapeSaved ? 'bg-green-50 text-green-700 cursor-default' : 'bg-brand text-white hover:bg-brand-dark'}`}
                    >
                      {scrapeSaved ? <><CheckCircle2 className="w-3.5 h-3.5" />Added to Pipeline</> : <><Plus className="w-3.5 h-3.5" />Add to Pipeline</>}
                    </button>
                  </div>
                )}

                {/* Directory shortcuts */}
                <div className="pt-1">
                  <p className="text-[10px] text-gray-400 font-medium mb-1.5">Search these directories for leads:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      ['CA State Parks', 'https://www.parks.ca.gov/'],
                      ['211 CA Nonprofits', 'https://www.211ca.org/'],
                      ['CA Naturalists', 'https://ucanr.edu/sites/canat/'],
                      ['UC Cooperative Ext.', 'https://ucanr.edu/'],
                      ['CNPS', 'https://www.cnps.org/'],
                    ].map(([label, href]) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-brand/10 hover:text-brand transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />{label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  AI Suggestions ({suggestions.length}) — add to pipeline or paste their URL above to scrape
                </h3>
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-white border border-app-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 bg-brand/10 text-brand rounded-full font-medium">{s.type.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">{s.county} County</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 leading-relaxed">{s.rationale}</p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />{s.sourceHint}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <a
                            href={`https://www.google.com/search?q="${encodeURIComponent(s.name)}"+"${encodeURIComponent(s.county)}"+California`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-brand/10 hover:text-brand transition-colors"
                          >
                            <Search className="w-3 h-3" />Google
                          </a>
                          <button
                            onClick={() => setScrapeUrl(`https://www.google.com/search?q="${s.name}"+${s.county}+California+site:*.org`)}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-brand/10 hover:text-brand transition-colors"
                          >
                            <Globe className="w-3 h-3" />Fill URL
                          </button>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(10)].map((_, j) => (
                            <Star key={j} className={`w-2.5 h-2.5 ${j < s.scoreEstimate ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-700">{s.scoreEstimate}/10</span>
                        <button
                          onClick={() => handleAddSuggestion(s)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors"
                        >
                          <Plus className="w-3 h-3" />Add to Pipeline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!discovering && suggestions.length === 0 && equityData.length > 0 && (
              <div className="text-center py-8 text-gray-400">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Click "Discover Prospects by Coverage Gap" to get AI-suggested organizations</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showAdd && <AddProspectModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
      {outreachTarget && <OutreachModal prospect={outreachTarget} onClose={() => { setOutreachTarget(null); load() }} />}
    </div>
  )
}

const inp = 'w-full text-xs border border-app-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand bg-white'
