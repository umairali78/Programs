'use client'
import { useEffect, useState } from 'react'
import { Plus, Sparkles, Trash2, Mail, ChevronDown, ChevronUp, Loader2, X, Copy, CheckCircle, Target } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app.store'

type ProspectStatus = 'new' | 'contacted' | 'responded' | 'enrolled' | 'declined'

interface Prospect {
  id: string; name: string; type: string | null; county: string | null
  address: string | null; notes: string | null; status: ProspectStatus
  ai_score: number | null; source_url: string | null; outreach_sent_at: number | null
  created_at: number; outreach_count: number
}

const STATUS_COLORS: Record<ProspectStatus, string> = {
  new: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-100 text-blue-700',
  responded: 'bg-yellow-100 text-yellow-700',
  enrolled: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
}
const STATUS_OPTIONS: ProspectStatus[] = ['new', 'contacted', 'responded', 'enrolled', 'declined']
const PARTNER_TYPES = ['Wetlands', 'Agriculture', 'Urban Ecology', 'Climate Justice', 'Indigenous Knowledge', 'General']
const CA_COUNTIES = ['Alameda', 'Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa', 'Del Norte', 'El Dorado', 'Fresno', 'Glenn', 'Humboldt', 'Imperial', 'Inyo', 'Kern', 'Kings', 'Lake', 'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa', 'Mendocino', 'Merced', 'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada', 'Orange', 'Placer', 'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino', 'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo', 'San Mateo', 'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Shasta', 'Sierra', 'Siskiyou', 'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare', 'Tuolumne', 'Ventura', 'Yolo', 'Yuba']

function AddProspectModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [county, setCounty] = useState('')
  const [address, setAddress] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      await invoke('prospect:create', { name: name.trim(), type: type || undefined, county: county || undefined, address: address || undefined, sourceUrl: sourceUrl || undefined, notes: notes || undefined })
      toast.success('Prospect added')
      onSaved()
    } catch { toast.error('Failed to add prospect') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <h2 className="text-sm font-semibold">Add Prospect</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Organization Name *"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Bay Area Nature Center" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                <option value="">Select…</option>
                {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="County">
              <select value={county} onChange={(e) => setCounty(e.target.value)} className={inputClass}>
                <option value="">Select…</option>
                {CA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Address"><input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="123 Nature Way, Oakland, CA" /></Field>
          <Field label="Source URL"><input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className={inputClass} placeholder="https://..." /></Field>
          <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} placeholder="Why this organization?" /></Field>
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

function OutreachModal({ prospect, onClose, onLogged }: { prospect: Prospect; onClose: () => void; onLogged: () => void }) {
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await invoke<{ subject: string; body: string } | null>('prospect:generateOutreach', { prospectId: prospect.id })
      if (result) { setSubject(result.subject); setBody(result.body); toast.success('Email generated') }
      else toast.error('AI unavailable — add Claude API key in Settings')
    } catch { toast.error('Generation failed') }
    finally { setGenerating(false) }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleLog = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Generate or write an email first'); return }
    setSaving(true)
    try { await invoke('prospect:logOutreach', { prospectId: prospect.id, subject, body }); toast.success('Outreach logged'); onLogged() }
    catch { toast.error('Failed to log outreach') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <div>
            <h2 className="text-sm font-semibold">Outreach Email — {prospect.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{prospect.county ?? 'Unknown county'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {hasClaudeKey && (
            <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors disabled:opacity-50">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate with AI
            </button>
          )}
          <Field label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} placeholder="Ten Strands Partnership Opportunity" /></Field>
          <Field label="Email Body"><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className={inputClass} placeholder="Write or generate email body..." /></Field>
        </div>
        <div className="flex justify-between items-center p-4 border-t border-app-border">
          <button onClick={handleCopy} disabled={!subject && !body} className="flex items-center gap-1.5 px-3 py-2 text-gray-600 text-xs hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Email'}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleLog} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Log as Sent
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProspectsPage() {
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [outreachProspect, setOutreachProspect] = useState<Prospect | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [scoring, setScoring] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    invoke<Prospect[]>('prospect:list').then(setProspects).catch(() => toast.error('Failed to load prospects')).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleStatusChange = async (id: string, status: ProspectStatus) => {
    try { await invoke('prospect:update', { id, updates: { status } }); load() }
    catch { toast.error('Failed to update status') }
  }

  const handleScore = async (prospect: Prospect) => {
    setScoring(prospect.id)
    try {
      const score = await invoke<number | null>('prospect:score', { prospectId: prospect.id })
      if (score !== null) {
        await invoke('prospect:update', { id: prospect.id, updates: { aiScore: score } })
        toast.success(`AI score: ${score}/10`)
        load()
      } else {
        toast.error('AI unavailable — add Claude API key in Settings')
      }
    } catch { toast.error('Scoring failed') }
    finally { setScoring(null) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete prospect "${name}"?`)) return
    try { await invoke('prospect:delete', { id }); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const byStatus = (status: ProspectStatus) => prospects.filter((p) => p.status === status)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Partner Prospects">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors">
          <Plus className="w-3.5 h-3.5" />Add Prospect
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="grid grid-cols-5 gap-3 mb-6">
          {STATUS_OPTIONS.map((status) => (
            <div key={status} className="bg-white border border-app-border rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{byStatus(status).length}</p>
              <p className="text-xs text-gray-500 capitalize mt-0.5">{status}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : prospects.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No prospects yet</p>
            <p className="text-xs mt-1">Add organizations you'd like to recruit as partners</p>
          </div>
        ) : (
          <div className="space-y-2">
            {prospects.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-app-border overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      {p.type && <span className="px-2 py-0.5 bg-brand-light text-brand text-[10px] rounded-full">{p.type}</span>}
                      {p.ai_score !== null && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-full font-medium">AI: {p.ai_score}/10</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{[p.county, p.address].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select value={p.status} onChange={(e) => handleStatusChange(p.id, e.target.value as ProspectStatus)}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${STATUS_COLORS[p.status]}`}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-white text-gray-900 capitalize">{s}</option>)}
                    </select>
                    {hasClaudeKey && (
                      <button onClick={() => handleScore(p)} disabled={scoring === p.id} className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors" title="AI Score">
                        {scoring === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button onClick={() => setOutreachProspect(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Generate Outreach">
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                      {expanded === p.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {expanded === p.id && (
                  <div className="px-4 pb-4 border-t border-app-border pt-3 space-y-2">
                    {p.notes && <p className="text-xs text-gray-600"><span className="font-medium">Notes:</span> {p.notes}</p>}
                    {p.source_url && <p className="text-xs text-gray-600"><span className="font-medium">Source:</span> <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{p.source_url}</a></p>}
                    <p className="text-xs text-gray-400">Outreach sent: {p.outreach_count} time{p.outreach_count !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddProspectModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
      {outreachProspect && <OutreachModal prospect={outreachProspect} onClose={() => setOutreachProspect(null)} onLogged={() => { setOutreachProspect(null); load() }} />}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>{children}</div>
}
const inputClass = 'w-full text-xs border border-app-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand bg-white'
