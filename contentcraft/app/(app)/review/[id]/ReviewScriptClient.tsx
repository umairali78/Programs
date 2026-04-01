'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CheckCircle, XCircle, Download } from 'lucide-react'

const DIMS = [
  { key: 'standardsCompliance', label: 'Standards Compliance', tip: 'Does the content follow the General Standards Guide?' },
  { key: 'gradeAppropriateness', label: 'Grade Appropriateness', tip: 'Is the vocabulary and complexity right for the grade?' },
  { key: 'templateAdherence', label: 'Template Adherence', tip: 'Does the content match the expected structure and format?' },
  { key: 'engagementQuality', label: 'Engagement Quality', tip: 'Is the content engaging and pedagogically sound?' },
  { key: 'pakistanContextAccuracy', label: 'Pakistan Context Accuracy', tip: 'Are examples and references appropriate for Pakistani students?' },
] as const

type DimKey = typeof DIMS[number]['key']

interface Script {
  id: string
  contentObjectType: string
  version: number
  scriptText: string
  reviewStatus: string
  complianceSummary: { criterion: string; status: string; note: string }[]
  run: { researchBrief: { sloText: string; grade: number; subject: string } | null }
  reviewFeedback: {
    id: string
    standardsCompliance: number
    gradeAppropriateness: number
    templateAdherence: number
    engagementQuality: number
    pakistanContextAccuracy: number
    freeText: string | null
    reviewer: { name: string | null; email: string }
    createdAt: string
  }[]
}

export default function ReviewScriptClient({
  script,
  reviewerId,
}: {
  script: Script
  reviewerId: string
}) {
  const router = useRouter()
  const [scores, setScores] = useState<Record<DimKey, number>>({
    standardsCompliance: 3,
    gradeAppropriateness: 3,
    templateAdherence: 3,
    engagementQuality: 3,
    pakistanContextAccuracy: 3,
  })
  const [freeText, setFreeText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [approving, setApproving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const setScore = (key: DimKey, val: number) =>
    setScores((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    setSubmitting(true)
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptId: script.id, ...scores, freeText }),
    })
    if (res.ok) {
      setSubmitted(true)
      router.refresh()
    }
    setSubmitting(false)
  }

  const handleApprove = async () => {
    setApproving(true)
    await fetch(`/api/scripts/${script.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    })
    router.push('/review')
  }

  const handleRequestRevision = async () => {
    const section = prompt('Which section needs revision?')
    if (!section) return
    const what = prompt('What needs to change?')
    if (!what) return
    const why = prompt('Why?')

    await fetch(`/api/scripts/${script.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'REVISION_REQUESTED',
        revisionInstructions: { section, whatToChange: what, why: why ?? '' },
      }),
    })
    router.push('/review')
  }

  const CO_LABELS: Record<string, string> = {
    CO1: 'Model Chapter', CO2: 'Reading Material', CO3: 'Video Script',
    CO4: 'Assessment', CO5: 'Learning Game', CO6: 'Glossary', CO7: 'Teacher Guide',
  }

  return (
    <div className="flex h-full">
      {/* Script content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {CO_LABELS[script.contentObjectType]} · v{script.version}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Grade {script.run.researchBrief?.grade} · {script.run.researchBrief?.subject}
              </p>
            </div>
            <a
              href={`/api/scripts/${script.id}/export?format=pdf`}
              className="btn-secondary text-xs"
              target="_blank"
            >
              <Download className="w-3 h-3" /> Export PDF
            </a>
          </div>

          {/* Compliance flags */}
          {script.complianceSummary?.some((c) => c.status === 'flag') && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-700 mb-1">Standards Flags</p>
              {script.complianceSummary.filter((c) => c.status === 'flag').map((c, i) => (
                <p key={i} className="text-xs text-yellow-700">• <strong>{c.criterion}:</strong> {c.note}</p>
              ))}
            </div>
          )}

          <div className="card p-6 prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{script.scriptText}</ReactMarkdown>
          </div>

          {/* Prior feedback */}
          {script.reviewFeedback.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Prior Reviews ({script.reviewFeedback.length})</h3>
              {script.reviewFeedback.map((f) => (
                <div key={f.id} className="card p-4 mb-3 text-sm">
                  <p className="text-xs text-gray-400 mb-2">
                    {f.reviewer.name ?? f.reviewer.email} · {new Date(f.createdAt).toLocaleDateString()}
                  </p>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {DIMS.map((d) => (
                      <div key={d.key} className="text-center">
                        <p className="text-xs text-gray-400">{d.label.split(' ')[0]}</p>
                        <p className={`font-bold ${f[d.key] < 3.5 ? 'text-red-500' : 'text-green-600'}`}>
                          {f[d.key]}/5
                        </p>
                      </div>
                    ))}
                  </div>
                  {f.freeText && <p className="text-xs text-gray-600 italic">{f.freeText}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review panel */}
      <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto p-5 shrink-0">
        <h2 className="font-semibold text-gray-900 mb-4">Submit Review</h2>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-green-700 font-medium">Review submitted!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {DIMS.map((dim) => (
              <div key={dim.key}>
                <label className="label text-xs">{dim.label}</label>
                <p className="text-xs text-gray-400 mb-1">{dim.tip}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setScore(dim.key, n)}
                      className={`w-9 h-9 rounded text-sm font-medium border transition-colors ${
                        scores[dim.key] === n
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-gray-200 text-gray-600 hover:border-brand-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="label text-xs">Notes (max 1000 chars)</label>
              <textarea
                className="input resize-none h-24 text-sm"
                maxLength={1000}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Overall feedback..."
              />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{freeText.length}/1000</p>
            </div>

            <button
              className="btn-primary w-full justify-center"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        )}

        {submitted && (
          <div className="mt-4 space-y-2 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">Decision</p>
            <button
              className="btn-primary w-full justify-center text-sm"
              onClick={handleApprove}
              disabled={approving}
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button
              className="btn-danger w-full justify-center text-sm"
              onClick={handleRequestRevision}
            >
              <XCircle className="w-4 h-4" /> Request Revision
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
