'use client'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, BookOpen, DollarSign, Edit2, Loader2, Map as MapIcon, Plus, Search, Star, Trash2, Users, X } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { formatCost, parseJsonArray } from '@/lib/utils'
import { ProgramForm } from '@/components/programs/ProgramForm'
import { useAppStore } from '@/store/app.store'

interface Program { id: string; partnerId: string; title: string; description: string | null; gradeLevels: string | null; subjects: string | null; cost: number | null; season: string | null; maxStudents: number | null; durationMins: number | null }
interface Partner { id: string; name: string; county?: string | null }

function ReviewModal({ program, partnerName, onClose, onSaved }: { program: Program; partnerName: string; onClose: () => void; onSaved: () => void }) {
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!activeTeacher) { toast.error('Select a teacher first'); return }
    if (!text.trim()) { toast.error('Please write a review'); return }
    setSaving(true)
    try {
      await invoke('review:create', { teacherId: activeTeacher.id, programId: program.id, rating, text: text.trim() })
      toast.success('Review submitted!')
      onSaved()
    } catch { toast.error('Failed to submit review') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Leave a Review</h2>
            <p className="text-xs text-gray-500 mt-0.5">{program.title} · {partnerName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} className="p-0.5">
                  <Star className={`w-6 h-6 transition-colors ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Your experience *</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Share what you and your students experienced..." className="w-full text-xs border border-app-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-app-border">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Submit Review
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProgramsPage() {
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const [programs, setPrograms] = useState<Program[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProgram, setEditProgram] = useState<Program | null>(null)
  const [reviewModal, setReviewModal] = useState<Program | null>(null)
  const [bookmarkSet, setBookmarkSet] = useState<Set<string>>(new Set())
  const [togglingBookmark, setTogglingBookmark] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('all')
  const [cost, setCost] = useState('all')

  const load = () => {
    setLoading(true)
    Promise.all([invoke<Program[]>('program:list'), invoke<Partner[]>('partner:list')])
      .then(([progs, parts]) => { setPrograms(progs); setPartners(parts) })
      .catch(() => toast.error('Failed to load programs'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!activeTeacher?.id) { setBookmarkSet(new Set()); return }
    invoke<string[]>('bookmark:getSet', { teacherId: activeTeacher.id })
      .then((ids) => setBookmarkSet(new Set(ids)))
      .catch(() => {})
  }, [activeTeacher?.id])

  const handleBookmarkToggle = async (programId: string) => {
    if (!activeTeacher) { toast.error('Select a teacher first'); return }
    setTogglingBookmark(programId)
    try {
      if (bookmarkSet.has(programId)) {
        await invoke('bookmark:remove', { teacherId: activeTeacher.id, programId })
        setBookmarkSet((prev) => { const s = new Set(prev); s.delete(programId); return s })
        toast.success('Removed from saved programs')
      } else {
        await invoke('bookmark:add', { teacherId: activeTeacher.id, programId })
        setBookmarkSet((prev) => new Set([...prev, programId]))
        toast.success('Program saved')
      }
    } catch { toast.error('Failed to update bookmark') }
    finally { setTogglingBookmark(null) }
  }

  const partnerMap = useMemo(() => new Map(partners.map((p) => [p.id, p])), [partners])
  const subjects = useMemo(() => Array.from(new Set(programs.flatMap((p) => parseJsonArray(p.subjects)))).sort(), [programs])
  const freePrograms = programs.filter((p) => !p.cost || p.cost === 0).length
  const mappedPrograms = programs.filter((p) => partnerMap.get(p.partnerId)?.county).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return programs.filter((p) => {
      const partner = partnerMap.get(p.partnerId)
      if (subject !== 'all' && !parseJsonArray(p.subjects).includes(subject)) return false
      if (cost === 'free' && p.cost && p.cost > 0) return false
      if (cost === 'paid' && (!p.cost || p.cost === 0)) return false
      if (!q) return true
      return [p.title, p.description, partner?.name, partner?.county].some((v) => v?.toLowerCase().includes(q))
    })
  }, [programs, partnerMap, query, subject, cost])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete program "${title}"?`)) return
    try { await invoke('program:delete', { id }); toast.success('Program deleted'); load() }
    catch { toast.error('Failed to delete program') }
  }

  const getPartnerName = (partnerId: string) => partnerMap.get(partnerId)?.name ?? 'Unknown Partner'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Programs">
        <div className="flex items-center gap-2">
          <Link to="/map" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-app-border text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"><MapIcon className="w-3.5 h-3.5" />Map</Link>
          <button onClick={() => { setEditProgram(null); setShowForm(true) }} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors">
            <Plus className="w-3.5 h-3.5" />Add Program
          </button>
        </div>
      </TopBar>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <MiniStat icon={BookOpen} label="Programs" value={programs.length} />
          <MiniStat icon={DollarSign} label="Free" value={freePrograms} />
          <MiniStat icon={MapIcon} label="County Tagged" value={mappedPrograms} />
        </div>

        <div className="bg-white border border-app-border rounded-xl p-3 flex flex-col lg:flex-row gap-2">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search programs, partners, counties..." className="bg-transparent outline-none text-sm flex-1 min-w-0" />
          </div>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="all">All subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={cost} onChange={(e) => setCost(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="all">Any cost</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm font-medium">No programs match those filters</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-app-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{getPartnerName(p.partnerId)}</p>
                    <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                    {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                      <span>{formatCost(p.cost)}</span>
                      {p.maxStudents && <span className="flex items-center gap-1"><Users className="w-3 h-3" />Max {p.maxStudents}</span>}
                      {parseJsonArray(p.gradeLevels).length > 0 && <span>Gr. {parseJsonArray(p.gradeLevels).join(', ')}</span>}
                      {parseJsonArray(p.subjects).slice(0, 3).map((s) => <span key={s} className="px-1.5 py-0.5 rounded-full bg-brand-light text-brand">{s}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {activeTeacher && (
                      <button
                        onClick={() => handleBookmarkToggle(p.id)}
                        disabled={togglingBookmark === p.id}
                        title={bookmarkSet.has(p.id) ? 'Remove bookmark' : 'Save program'}
                        className={`p-1.5 rounded-lg transition-colors ${bookmarkSet.has(p.id) ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300 hover:text-blue-400 hover:bg-blue-50'}`}
                      >
                        {togglingBookmark === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : bookmarkSet.has(p.id) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {activeTeacher && (
                      <button onClick={() => setReviewModal(p)} title="Leave a review" className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-300 hover:text-amber-500 transition-colors">
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => { setEditProgram(p); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(p.id, p.title)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <ProgramForm program={editProgram} partners={partners} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
      {reviewModal && <ReviewModal program={reviewModal} partnerName={getPartnerName(reviewModal.partnerId)} onClose={() => setReviewModal(null)} onSaved={() => setReviewModal(null)} />}
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return <div className="bg-white border border-app-border rounded-xl p-4 flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center"><Icon className="w-4 h-4 text-brand" /></div><div><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div></div>
}
