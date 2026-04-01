'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, RefreshCw } from 'lucide-react'

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
  const selectedCOs = searchParams.get('selectedCOs')?.split(',') ?? []

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
      // Navigate to new brief
      router.push(`/generate/brief/${data.briefId}?selectedCOs=${selectedCOs.join(',')}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Regeneration failed')
      setRegenerating(false)
    }
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
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Research Brief</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and edit before generating content. Grade {brief.grade} · {brief.subject}
        </p>
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

      {/* Key Vocabulary */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Key Vocabulary ({brief.keyVocabulary?.length ?? 0} terms)
        </p>
        <div className="space-y-3">
          {brief.keyVocabulary?.map((v, i) => (
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
          {brief.pakistanExamples?.map((ex, i) => (
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
          {brief.commonMisconceptions?.map((m, i) => (
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

      {/* Approve */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          type="button"
          className="btn-primary"
          onClick={handleApprove}
          disabled={approving}
        >
          <CheckCircle className="w-4 h-4" />
          {approving ? 'Starting generation...' : `Approve & Generate ${selectedCOs.length} Objects`}
        </button>
      </div>
    </div>
  )
}
