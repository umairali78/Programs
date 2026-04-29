'use client'
import { useEffect, useState } from 'react'
import {
  CheckCircle2, Eye, Loader2, Mail, RefreshCw,
  Sparkles, Users, X
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app.store'

interface Teacher {
  id: string
  name: string
  email: string | null
  schoolName: string | null
}

interface DigestResult {
  teacherId: string
  teacherName: string
  success: boolean
  digestHtml?: string
}

export function DigestsPage() {
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, current: '' })
  const [results, setResults] = useState<DigestResult[] | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState('')

  useEffect(() => {
    invoke<Teacher[]>('teacher:list')
      .then((ts) => {
        setTeachers(ts)
        setSelected(new Set(ts.map((t) => t.id)))
      })
      .catch(() => toast.error('Failed to load teachers'))
      .finally(() => setLoading(false))
  }, [])

  const toggleAll = () => {
    if (selected.size === teachers.length) setSelected(new Set())
    else setSelected(new Set(teachers.map((t) => t.id)))
  }

  const toggleTeacher = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleGenerate = async () => {
    if (!selected.size) { toast.error('Select at least one teacher'); return }
    if (!hasClaudeKey) { toast.error('Add an AI API key in Settings'); return }

    const targets = teachers.filter((t) => selected.has(t.id))
    setGenerating(true)
    setResults(null)
    setProgress({ done: 0, total: targets.length, current: targets[0]?.name ?? '' })

    const allResults: DigestResult[] = []
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i]
      setProgress({ done: i, total: targets.length, current: t.name })
      try {
        const html = await invoke<string | null>('digest:generate', { teacherId: t.id })
        allResults.push({ teacherId: t.id, teacherName: t.name, success: !!html, digestHtml: html ?? undefined })
      } catch {
        allResults.push({ teacherId: t.id, teacherName: t.name, success: false })
      }
    }
    setProgress({ done: targets.length, total: targets.length, current: '' })
    setResults(allResults)
    const ok = allResults.filter((r) => r.success).length
    if (ok > 0) toast.success(`Generated and saved ${ok}/${targets.length} digests`)
    else toast.error('No digests generated — check your API key in Settings')
    setGenerating(false)
  }

  const resultMap = new Map(results?.map((r) => [r.teacherId, r]) ?? [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Teacher Digests" />

      {!hasClaudeKey && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Digest generation requires an AI API key. Add your Claude or OpenAI key in <strong>Settings</strong>.</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-5">

        {/* Hero */}
        <div className="bg-gradient-to-br from-brand to-[#0d4a28] rounded-2xl p-5 text-white">
          <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-green-300" />Monthly Digest Generator
          </h2>
          <p className="text-xs text-white/70 leading-relaxed">
            Generate personalized "Your Outdoor Classroom" email digests for selected teachers.
            Each digest highlights nearby programs matched to that teacher's grade levels and subjects,
            plus a seasonal spotlight and curriculum connection tip.
            Digests are saved to the database and can be previewed here.
          </p>
        </div>

        {/* Teacher selection */}
        <div className="bg-white border border-app-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-app-border flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Select Teachers ({selected.size}/{teachers.length})
            </p>
            <button onClick={toggleAll} className="text-xs text-brand hover:underline font-medium">
              {selected.size === teachers.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : teachers.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-gray-400">
              No teachers found. Load demo data or add teachers first.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {teachers.map((t) => {
                const isSelected = selected.has(t.id)
                const result = resultMap.get(t.id)

                return (
                  <div
                    key={t.id}
                    onClick={() => !generating && toggleTeacher(t.id)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${generating ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'} ${isSelected ? 'bg-brand/[0.02]' : ''}`}
                  >
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-brand border-brand' : 'border-gray-300'}`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>

                    {/* Teacher info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">{t.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {t.email ?? 'No email'}{t.schoolName ? ` · ${t.schoolName}` : ''}
                      </p>
                    </div>

                    {/* Result badge */}
                    {result && (
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {result.success ? (
                          <>
                            <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />Saved
                            </span>
                            {result.digestHtml && (
                              <button
                                onClick={() => { setPreviewHtml(result.digestHtml!); setPreviewName(t.name) }}
                                className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-brand/10 text-brand rounded-lg hover:bg-brand/20 font-medium transition-colors"
                              >
                                <Eye className="w-3 h-3" />Preview
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-red-500 font-medium">✗ Failed</span>
                        )}
                      </div>
                    )}

                    {/* In-progress spinner */}
                    {generating && progress.current === t.name && !result && (
                      <Loader2 className="w-3.5 h-3.5 text-brand animate-spin shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Generate button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || !selected.size || !hasClaudeKey || loading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {generating
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Mail className="w-3.5 h-3.5" />}
            {generating
              ? `Generating… (${progress.done}/${progress.total})`
              : `Generate ${selected.size || ''} Digest${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Progress bar */}
        {generating && progress.total > 0 && (
          <div className="space-y-2">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 bg-brand rounded-full transition-all duration-300"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Processing: <strong>{progress.current}</strong> ({progress.done}/{progress.total})
            </p>
          </div>
        )}

        {/* Summary */}
        {results && !generating && (
          <div className={`rounded-xl p-4 flex items-start gap-3 border ${results.every((r) => r.success) ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${results.every((r) => r.success) ? 'text-green-600' : 'text-amber-600'}`} />
            <div>
              <p className={`text-sm font-semibold ${results.every((r) => r.success) ? 'text-green-800' : 'text-amber-800'}`}>
                {results.filter((r) => r.success).length} of {results.length} digests generated and saved to database
              </p>
              {results.filter((r) => !r.success).length > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Failed: {results.filter((r) => !r.success).map((r) => r.teacherName).join(', ')}.
                  Check your API key in Settings.
                </p>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                Click <strong>Preview</strong> next to any teacher to view their digest.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Digest preview modal */}
      {previewHtml && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-app-border">
              <p className="text-sm font-semibold text-gray-900">Digest Preview — {previewName}</p>
              <button
                onClick={() => setPreviewHtml(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                className="prose prose-sm max-w-none text-gray-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
