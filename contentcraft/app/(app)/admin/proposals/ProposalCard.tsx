'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Suggestion {
  field: string
  currentValue: string
  suggestedValue: string
  rationale: string
  evidence: string
}

interface Proposal {
  id: string
  type: string
  contentObjectType: string
  status: string
  triggeredByDimension: string | null
  suggestions: unknown
  createdAt: Date
  adminNotes: string | null
}

export default function ProposalCard({ proposal, readonly = false }: { proposal: Proposal; readonly?: boolean }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [accepted, setAccepted] = useState<number[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const suggestions = (proposal.suggestions as Suggestion[]) ?? []

  const toggle = (i: number) =>
    setAccepted((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])

  const resolve = async (status: 'ACCEPTED' | 'REJECTED') => {
    setLoading(true)
    await fetch(`/api/proposals/${proposal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes: notes, acceptedIndices: status === 'ACCEPTED' ? accepted : [] }),
    })
    router.refresh()
  }

  const statusBadge: Record<string, string> = {
    PENDING: 'badge-review',
    ACCEPTED: 'badge-approved',
    REJECTED: 'badge-revision',
  }

  return (
    <div className="card">
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={statusBadge[proposal.status]}>{proposal.status}</span>
            <span className="text-xs text-gray-400">{proposal.type}</span>
            <span className="text-xs font-semibold text-gray-700">{proposal.contentObjectType}</span>
          </div>
          <p className="text-sm text-gray-600">
            Triggered by: <strong>{proposal.triggeredByDimension ?? 'Unknown'}</strong> · {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className={`border rounded-lg p-3 ${!readonly && accepted.includes(i) ? 'border-brand-400 bg-brand-50' : 'border-gray-200'}`}
            >
              <div className="flex items-start gap-3">
                {!readonly && (
                  <input
                    type="checkbox"
                    checked={accepted.includes(i)}
                    onChange={() => toggle(i)}
                    className="mt-1"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.field}</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500 line-through">{s.currentValue?.slice(0, 120)}...</p>
                    <p className="text-xs text-green-700 font-medium">{s.suggestedValue?.slice(0, 200)}...</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1"><strong>Why:</strong> {s.rationale}</p>
                  <p className="text-xs text-gray-400"><strong>Evidence:</strong> {s.evidence}</p>
                </div>
              </div>
            </div>
          ))}

          {!readonly && (
            <div className="pt-2 space-y-3">
              <div>
                <label className="label text-xs">Admin Notes</label>
                <textarea
                  className="input resize-none h-16 text-sm"
                  placeholder="Optional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-primary text-sm"
                  onClick={() => resolve('ACCEPTED')}
                  disabled={loading || accepted.length === 0}
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept Selected ({accepted.length})
                </button>
                <button className="btn-danger text-sm" onClick={() => resolve('REJECTED')} disabled={loading}>
                  <XCircle className="w-4 h-4" />
                  Reject All
                </button>
              </div>
            </div>
          )}

          {readonly && proposal.adminNotes && (
            <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
              <strong>Admin notes:</strong> {proposal.adminNotes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
