'use client'
import { useEffect, useState } from 'react'
import { BookOpen, Plus, Sparkles, Trash2, Search, FileText, Loader2, X } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app.store'

interface LessonPlan {
  id: string; teacher_id: string; program_id: string | null; title: string
  content: string | null; grade_level: string | null; subjects: string | null
  created_at: number; program_title?: string; partner_name?: string
}
interface Program { id: string; title: string; partnerId: string }
interface Partner { id: string; name: string }

function CreateModal({ onClose, onSaved, programs, partners }: {
  onClose: () => void; onSaved: () => void
  programs: Program[]; partners: Partner[]
}) {
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [programId, setProgramId] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  const partnerMap = new Map(partners.map((p) => [p.id, p.name]))

  const handleGenerate = async () => {
    if (!activeTeacher?.id || !programId) { toast.error('Select a program first'); return }
    setGenerating(true)
    try {
      const result = await invoke<string | null>('lessonPlan:generate', { teacherId: activeTeacher.id, programId })
      if (result) {
        setContent(result)
        const prog = programs.find((p) => p.id === programId)
        if (!title && prog) setTitle(`Pre-Visit: ${prog.title}`)
        toast.success('Lesson plan generated')
      } else {
        toast.error('AI unavailable — add Claude API key in Settings')
      }
    } catch { toast.error('Generation failed') }
    finally { setGenerating(false) }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Title and content are required'); return }
    if (!activeTeacher?.id) { toast.error('Select a teacher first'); return }
    setSaving(true)
    try {
      await invoke('lessonPlan:create', {
        teacherId: activeTeacher.id,
        programId: programId || undefined,
        title: title.trim(),
        content: content.trim(),
        gradeLevel: gradeLevel || undefined,
      })
      toast.success('Lesson plan saved')
      onSaved()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <h2 className="text-sm font-semibold text-gray-900">New Lesson Plan</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Linked Program (optional)</label>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} className={inputClass}>
              <option value="">No program linked</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{partnerMap.get(p.partnerId) ?? ''} — {p.title}</option>)}
            </select>
          </div>
          {hasClaudeKey && programId && (
            <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors disabled:opacity-50">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate with AI
            </button>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Pre-Visit: Wetland Exploration" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Grade Level</label>
            <input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className={inputClass} placeholder="e.g. 4th Grade" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Content *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className={inputClass} placeholder="Write your lesson plan here, or generate with AI above..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-app-border">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Save Plan
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewModal({ plan, onClose, onDelete }: { plan: LessonPlan; onClose: () => void; onDelete: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{plan.title}</h2>
            {plan.program_title && <p className="text-xs text-gray-500 mt-0.5">{plan.partner_name} — {plan.program_title}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{plan.content}</pre>
        </div>
        <div className="flex justify-between items-center p-4 border-t border-app-border">
          <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-2 text-red-600 text-xs hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />Delete
          </button>
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
        </div>
      </div>
    </div>
  )
}

export function LessonPlansPage() {
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const [plans, setPlans] = useState<LessonPlan[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [viewPlan, setViewPlan] = useState<LessonPlan | null>(null)
  const [query, setQuery] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      invoke<LessonPlan[]>('lessonPlan:list', activeTeacher?.id ? { teacherId: activeTeacher.id } : {}),
      invoke<Program[]>('program:list'),
      invoke<Partner[]>('partner:list'),
    ])
      .then(([lp, progs, parts]) => { setPlans(lp); setPrograms(progs); setPartners(parts) })
      .catch(() => toast.error('Failed to load lesson plans'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [activeTeacher?.id])

  const filtered = plans.filter((p) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [p.title, p.content, p.program_title, p.partner_name, p.grade_level].some((v) => v?.toLowerCase().includes(q))
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson plan?')) return
    try { await invoke('lessonPlan:delete', { id }); toast.success('Deleted'); setViewPlan(null); load() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Lesson Plans">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors">
          <Plus className="w-3.5 h-3.5" />New Plan
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
        <div className="bg-white border border-app-border rounded-xl p-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lesson plans..." className="bg-transparent outline-none text-sm flex-1" />
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No lesson plans yet</p>
            <p className="text-xs mt-1">Create one manually or generate with AI from any program</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((plan) => (
              <button key={plan.id} onClick={() => setViewPlan(plan)} className="w-full text-left bg-white rounded-xl border border-app-border p-4 hover:border-brand transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-brand shrink-0" />
                      <p className="text-sm font-semibold text-gray-900 truncate">{plan.title}</p>
                    </div>
                    {plan.program_title && (
                      <p className="text-xs text-gray-500">{plan.partner_name} — {plan.program_title}</p>
                    )}
                    {plan.grade_level && <p className="text-xs text-gray-400 mt-0.5">{plan.grade_level}</p>}
                    {plan.content && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{plan.content.slice(0, 120)}...</p>}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{new Date(plan.created_at * 1000).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load() }} programs={programs} partners={partners} />}
      {viewPlan && <ViewModal plan={viewPlan} onClose={() => setViewPlan(null)} onDelete={() => handleDelete(viewPlan.id)} />}
    </div>
  )
}

const inputClass = 'w-full text-xs border border-app-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand bg-white'
