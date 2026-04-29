'use client'
import { useEffect, useState } from 'react'
import {
  AlertCircle, Building2, CheckCircle2, ChevronDown, ChevronRight, Copy,
  Loader2, Mail, MapPin, Plus, RefreshCw, Search, Sparkles, Star, Trash2, X,
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
interface AISuggestion {
  name: string; type: string; county: string; rationale: string
  scoreEstimate: number; sourceHint: string
}
interface EquityRow {
  county: string; programs: number; schools: number; title1Pct: number; burden: number; priority: number
}

const STATUS_COLORS: Record<ProspectStatus, string> = {
  new: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-50 text-blue-700',
  responded: 'bg-amber-50 text-amber-700',
  enrolled: 'bg-green-50 text-green-700',
  declined: 'bg-red-50 text-red-600',
}

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
      toast.success('Outreach logged')
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

export function ProspectorPage() {
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)
  const [tab, setTab] = useState<'pipeline' | 'discover'>('pipeline')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [outreachTarget, setOutreachTarget] = useState<Prospect | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [query, setQuery] = useState('')
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

  const handleDiscover = async () => {
    if (!hasClaudeKey) { toast.error('Add Claude API key in Settings'); return }
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
      await invoke('prospect:create', { name: s.name, type: s.type, county: s.county, notes: `AI suggested: ${s.rationale}\nSource: ${s.sourceHint}` })
      toast.success(`${s.name} added to pipeline`)
      load()
    } catch { toast.error('Failed to add') }
  }

  const handleScore = async (id: string) => {
    try {
      const score = await invoke<number | null>('prospect:score', { prospectId: id })
      if (score == null) { toast.error('AI scoring unavailable — add API key in Settings'); return }
      await invoke('prospect:update', { id, updates: { aiScore: score } })
      toast.success(`AI score: ${score}/10`); load()
    } catch { toast.error('Scoring failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prospect?')) return
    try { await invoke('prospect:delete', { id }); load() } catch { toast.error('Failed to delete') }
  }

  const filtered = prospects.filter((p) => {
    const q = query.trim().toLowerCase()
    return !q || [p.name, p.county, p.type].some(v => v?.toLowerCase().includes(q))
  })

  const byStatus = (s: ProspectStatus) => filtered.filter(p => p.status === s)
  const pipelineOrder: ProspectStatus[] = ['new', 'contacted', 'responded', 'enrolled', 'declined']

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Intelligent Prospector">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors">
          <Plus className="w-3.5 h-3.5" />Add Prospect
        </button>
      </TopBar>

      <div className="flex border-b border-app-border bg-white px-6">
        {([['pipeline', 'Pipeline', Building2], ['discover', 'AI Discover', Sparkles]] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${tab === t ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">

        {tab === 'pipeline' && (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
              {pipelineOrder.map(s => (
                <div key={s} className="bg-white border border-app-border rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{byStatus(s).length}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[s]}`}>{s}</span>
                </div>
              ))}
            </div>

            <div className="bg-white border border-app-border rounded-xl p-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prospects…" className="bg-transparent outline-none text-sm flex-1" />
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No prospects yet</p>
                <p className="text-xs mt-1">Add manually or use AI Discover to find organizations by county gap</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-app-border">
                    <div className="flex items-center gap-3 p-3.5">
                      <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="text-gray-400 shrink-0">
                        {expanded === p.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                          {p.county && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.county}</span>}
                          {p.type && <span>{p.type.replace(/_/g, ' ')}</span>}
                          {p.outreach_count > 0 && <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" />{p.outreach_count} sent</span>}
                          {p.ai_score != null && <span className="flex items-center gap-0.5 text-amber-600"><Star className="w-3 h-3 fill-amber-400" />{p.ai_score}/10</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <select value={p.status} onChange={async (e) => { await invoke('prospect:update', { id: p.id, updates: { status: e.target.value } }); load() }} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                          {(['new','contacted','responded','enrolled','declined'] as ProspectStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => setOutreachTarget(p)} title="Compose outreach" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"><Mail className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleScore(p.id)} title="AI score" className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-300 hover:text-amber-500 transition-colors"><Sparkles className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {expanded === p.id && (
                      <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 space-y-1">
                        {p.notes && <p><span className="font-medium text-gray-700">Notes:</span> {p.notes}</p>}
                        {p.source_url && <p><span className="font-medium text-gray-700">Source:</span> <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="text-brand underline">{p.source_url}</a></p>}
                        <p><span className="font-medium text-gray-700">Added:</span> {new Date(p.created_at * 1000).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'discover' && (
          <div className="max-w-3xl space-y-5">
            <div className="bg-gradient-to-br from-brand to-[#0d4a28] rounded-2xl p-5 text-white">
              <h2 className="text-sm font-bold mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-300" />AI Prospect Discovery</h2>
              <p className="text-xs text-white/70 mb-4 leading-relaxed">Claude analyzes county coverage gaps and equity data to suggest specific organizations to target — nonprofits, state parks, county ag programs, university extensions, and more.</p>
              <button onClick={handleDiscover} disabled={discovering} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg border border-white/30 transition-colors disabled:opacity-50">
                {discovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {discovering ? 'Analyzing gaps…' : 'Discover Prospects by Gap'}
              </button>
            </div>

            {equityData.length > 0 && (
              <div className="bg-white border border-app-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-app-border flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">Top Priority Counties (gap × equity)</p>
                  <span className="text-[10px] text-gray-400">based on programs, Title I schools, CalEnviroScreen</span>
                </div>
                {equityData.slice(0, 8).map((row) => (
                  <div key={row.county} className="px-4 py-2.5 grid grid-cols-5 gap-2 text-xs border-b border-gray-50 last:border-0 items-center">
                    <span className="font-medium text-gray-800 col-span-1">{row.county}</span>
                    <span className="text-gray-500">{row.programs} programs</span>
                    <span className="text-gray-500">{row.schools} schools</span>
                    <span className="text-gray-500">{row.title1Pct}% Title I</span>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 bg-brand rounded-full" style={{ width: `${Math.min(100, row.priority)}%` }} />
                      </div>
                      <span className="font-semibold text-brand text-[10px] w-6 text-right">{row.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />AI Suggestions ({suggestions.length})</h3>
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-white border border-app-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 bg-brand-light text-brand rounded-full">{s.type.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{s.county} County · {s.rationale}</p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{s.sourceHint}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-gray-700">{s.scoreEstimate}/10</span>
                        </div>
                        <button onClick={() => handleAddSuggestion(s)} className="flex items-center gap-1 px-2.5 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors">
                          <Plus className="w-3 h-3" />Add to Pipeline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
