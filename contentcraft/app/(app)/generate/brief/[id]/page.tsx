'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, RefreshCw, Download } from 'lucide-react'

interface VocabItem { term: string; definition: string; gradeAppropriateExample: string }

interface Brief {
  id: string
  sloText: string
  grade: number
  subject: string
  coreConcept: string | null
  prerequisites: string[]
  keyVocabulary: VocabItem[]
  pakistanExamples: string[]
  commonMisconceptions: string[]
  bloomsLevel: string | null
  pedagogicalNotes: string | null
  status: string
  userNotes: string | null
}

export default function ResearchBriefPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCOs = searchParams.get('selectedCOs')?.split(',').filter(Boolean) ?? []

  const [brief, setBrief] = useState<Brief | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [focusInstruction, setFocusInstruction] = useState('')
  const [userNotes, setUserNotes] = useState('')

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      try {
        const res = await fetch(`/api/briefs/${params.id}`)
        if (res.ok) {
          const data: Brief = await res.json()
          setBrief(data)
          setLoading(false)
          if (data.status === 'draft' || data.status === 'approved') return
        }
      } catch {}
      timer = setTimeout(poll, 2000)
    }

    poll()
    return () => clearTimeout(timer)
  }, [params.id])

  const handleApprove = async () => {
    if (!brief) return
    setApproving(true)
    try {
      const res = await fetch(`/api/runs/${params.id}/approve-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefId: brief.id,
          selectedCOs,
          edits: userNotes ? { userNotes } : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/generate/${data.runId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve brief')
      setApproving(false)
    }
  }

  const handleRegenerate = async () => {
    if (!brief) return
    setRegenerating(true)
    try {
      const res = await fetch(`/api/briefs/${brief.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusInstruction }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/generate/brief/${data.briefId}?selectedCOs=${selectedCOs.join(',')}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Regeneration failed')
      setRegenerating(false)
    }
  }

  const handleDownloadBrief = () => {
    window.open(`/api/briefs/${params.id}/download`)
  }

  if (brief?.status === 'failed') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="card p-10 text-center">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-xl font-bold">!</span>
          </div>
          <p className="font-semibold text-gray-800">Research Brief Generation Failed</p>
          {brief.userNotes && brief.userNotes.startsWith('Generation error:') && (
            <p className="text-xs font-mono bg-red-50 border border-red-100 rounded p-3 mt-3 text-red-700 text-left max-w-lg mx-auto break-words">
              {brief.userNotes}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto">
            Check the server terminal for full details, then try again.
          </p>
          <button
            className="btn-primary mt-6"
            onClick={() => window.location.href = '/generate/new'}
          >
            Start New Generation
          </button>
        </div>
      </div>
    )
  }

  if (loading || !brief || brief.status === 'generating' || brief.status === 'pending') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="card p-10 text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold text-gray-700">Generating Research Brief...</p>
          <p className="text-sm text-gray-400 mt-2">
            Analyzing the SLO, calibrating for Grade {brief?.grade ?? '?'}, anchoring Pakistan context.
          </p>
          <div className="mt-4 space-y-1 text-xs text-gray-400">
            <p>• Retrieving relevant curriculum standards</p>
            <p>• Identifying key vocabulary and concepts</p>
            <p>• Building Pakistan-context examples</p>
            <p>• Classifying Bloom&apos;s Taxonomy level</p>
          </div>
          <p className="text-xs text-gray-300 mt-4">This takes 30–60 seconds with the AI model...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Research Brief</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and edit before generating content. Grade {brief.grade} · {brief.subject}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={handleDownloadBrief}
        >
          <Download className="w-4 h-4" />
          Download Brief (.docx)
        </button>
      </div>

      {/* SLO */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">SLO</p>
        <p className="text-sm text-gray-800 leading-relaxed">{brief.sloText}</p>
        <div className="mt-3">
          <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
            Bloom&apos;s: {brief.bloomsLevel ?? 'Unknown'}
          </span>
        </div>
      </div>

      {/* Core Concept */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Core Concept</p>
        <p className="text-sm text-gray-800 leading-relaxed">{brief.coreConcept ?? '—'}</p>
      </div>

      {/* Prerequisites */}
      {brief.prerequisites?.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Prerequisites ({brief.prerequisites.length})
          </p>
          <ul className="space-y-1">
            {brief.prerequisites.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-brand-400 shrink-0">→</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Vocabulary */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Key Vocabulary ({brief.keyVocabulary?.length ?? 0} terms)
        </p>
        <div className="space-y-3">
          {(brief.keyVocabulary ?? []).map((v, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-900">{v.term}</p>
              <p className="text-xs text-gray-600 mt-1">{v.definition}</p>
              <p className="text-xs text-brand-600 mt-1 italic">e.g. {v.gradeAppropriateExample}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pakistan Examples */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pakistan Context Examples</p>
        <ul className="space-y-1">
          {(brief.pakistanExamples ?? []).map((ex, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-brand-400 shrink-0">•</span>
              <span>{ex}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Common Misconceptions */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Common Misconceptions</p>
        <ul className="space-y-1">
          {(brief.commonMisconceptions ?? []).map((m, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-orange-400 shrink-0">!</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pedagogical Notes */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pedagogical Notes</p>
        <p className="text-sm text-gray-700 leading-relaxed">{brief.pedagogicalNotes}</p>
      </div>

      {/* Designer Notes */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Notes (optional)</p>
        <textarea
          className="input resize-none h-20 text-sm"
          placeholder="Add any notes or adjustments for the generation..."
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
        />
      </div>

      {/* Regeneration */}
      <div className="card p-5 border-dashed">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Regenerate with Focus</p>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1 text-sm"
            placeholder="e.g. Focus more on real-world applications..."
            value={focusInstruction}
            onChange={(e) => setFocusInstruction(e.target.value)}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Content Objects selected */}
      {selectedCOs.length > 0 && (
        <div className="card p-5 bg-brand-50 border-brand-100">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-2">
            Will Generate {selectedCOs.length} Content Object{selectedCOs.length > 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCOs.map((co) => (
              <span key={co} className="px-2 py-0.5 bg-white border border-brand-200 text-brand-700 rounded text-xs font-medium">
                {co}
              </span>
            ))}
          </div>
          <p className="text-xs text-brand-500 mt-2">You can change this on the next page.</p>
        </div>
      )}

      {/* Approve */}
      <div className="flex justify-between items-center gap-3 pb-8">
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={handleDownloadBrief}
        >
          <Download className="w-4 h-4" />
          Download Brief
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleApprove}
          disabled={approving || selectedCOs.length === 0}
        >
          <CheckCircle className="w-4 h-4" />
          {approving ? 'Starting generation...' : `Approve & Generate ${selectedCOs.length} Object${selectedCOs.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
