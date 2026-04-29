'use client'
import { useEffect, useState } from 'react'
import {
  AlertCircle, ArrowRight, Building2, CheckCircle2, ChevronDown, ChevronRight, Copy,
  ExternalLink, Filter, Loader2, Mail, MapPin, Pencil, Plus, RefreshCw,
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
            {/* Hero card */}
            <div className="bg-gradient-to-br from-brand to-[#0d4a28] rounded-2xl p-5 text-white">
              <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />AI Prospect Discovery
              </h2>
              <p className="text-xs text-white/70 mb-4 leading-relaxed">
                AI analyzes county coverage gaps and equity data to suggest specific organizations to target —
                nonprofits, state parks, county ag programs, university extensions, and more.
                Top 8 priority counties are used as input.
              </p>
              <button
                onClick={handleDiscover}
                disabled={discovering}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg border border-white/30 transition-colors disabled:opacity-50"
              >
                {discovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {discovering ? 'Analyzing gaps…' : 'Discover Prospects by Coverage Gap'}
              </button>
            </div>

            {/* Priority county table */}
            {equityData.length > 0 && (
              <div className="bg-white border border-app-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-app-border flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">Top 8 Priority Counties — AI Discovery Input</p>
                  <span className="text-[10px] text-gray-400">ranked by burden × equity × coverage gap</span>
                </div>
                {equityData.slice(0, 8).map((row, i) => {
                  const coverageGap = Math.max(0, 100 - row.programsPerSchool * 50)
                  return (
                    <div key={row.county} className="px-4 py-2.5 grid grid-cols-12 gap-2 text-xs border-b border-gray-50 last:border-0 items-center">
                      <span className="col-span-1 text-[10px] font-bold text-gray-300">#{i + 1}</span>
                      <span className="col-span-3 font-medium text-gray-800">{row.county}</span>
                      <span className="col-span-2 text-gray-500">{row.programs} programs</span>
                      <span className="col-span-2 text-gray-500">{row.schools} schools</span>
                      <span className="col-span-2 text-gray-500">{row.title1Pct}% Title I</span>
                      <div className="col-span-2 flex items-center gap-1">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 bg-brand rounded-full" style={{ width: `${Math.min(100, row.priority)}%` }} />
                        </div>
                        <span className="font-bold text-brand text-[10px] w-5 text-right">{row.priority}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  AI Suggestions ({suggestions.length}) — click to add to pipeline
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
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
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

            {/* Empty state after discovery */}
            {!discovering && suggestions.length === 0 && equityData.length > 0 && (
              <div className="text-center py-8 text-gray-400">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Click "Discover Prospects by Coverage Gap" to get AI suggestions</p>
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
