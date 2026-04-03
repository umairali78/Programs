'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { RefreshCw, Download, CheckCircle, AlertCircle, Clock, Loader2, X, Play, FileDown } from 'lucide-react'

const CO_LABELS: Record<string, string> = {
  CO1: 'Model Chapter',
  CO2: 'Reading Material',
  CO3: 'Video Script',
  CO4: 'Assessment',
  CO5: 'Learning Game',
  CO6: 'Glossary',
  CO7: 'Teacher Guide',
}

interface ScriptSummary {
  id: string
  coType: string
  version: number
  reviewStatus: string
  status: string
  hasCompliance: boolean
}

interface RunState {
  runId: string
  status: string
  scripts: ScriptSummary[]
}

interface Script {
  id: string
  contentObjectType: string
  version: number
  scriptText: string
  complianceSummary: { criterion: string; status: string; note: string }[]
  reviewStatus: string
}

function statusLabel(status: string) {
  switch (status) {
    case 'done':
    case 'complete': return 'Complete'
    case 'failed': return 'Failed'
    case 'queued': return 'Queued'
    case 'generating': return 'Generating...'
    default: return 'Pending'
  }
}

function statusIcon(status: string) {
  switch (status) {
    case 'done':
    case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'queued': return <Clock className="w-4 h-4 text-gray-400" />
    case 'generating': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    default: return <Clock className="w-4 h-4 text-gray-300" />
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'done':
    case 'complete': return 'text-green-600 bg-green-50'
    case 'failed': return 'text-red-600 bg-red-50'
    case 'generating': return 'text-blue-600 bg-blue-50'
    default: return 'text-gray-500 bg-gray-50'
  }
}

export default function GenerationOutputPage({ params }: { params: { runId: string } }) {
  const [runState, setRunState] = useState<RunState | null>(null)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [scripts, setScripts] = useState<Record<string, Script>>({})
  const [regenDrawerOpen, setRegenDrawerOpen] = useState<string | null>(null)
  const [regenInstruction, setRegenInstruction] = useState('')
  const [regenLoading, setRegenLoading] = useState(false)
  const [generatingSingle, setGeneratingSingle] = useState<string | null>(null)

  // SSE for real-time progress
  useEffect(() => {
    const es = new EventSource(`/api/runs/${params.runId}/stream`)
    es.onmessage = (e) => {
      const data: RunState = JSON.parse(e.data)
      setRunState(data)
      if (!activeTab && data.scripts.length > 0) {
        setActiveTab(data.scripts[0].coType)
      }
      for (const s of data.scripts) {
        if ((s.status === 'complete' || s.status === 'done') && !scripts[s.id]) {
          fetchScript(s.id)
        }
      }
    }
    es.onerror = () => es.close()
    return () => es.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.runId])

  const fetchScript = async (scriptId: string) => {
    const res = await fetch(`/api/scripts/${scriptId}`)
    if (res.ok) {
      const data = await res.json()
      setScripts((prev) => ({ ...prev, [scriptId]: data }))
    }
  }

  const handleRegenerate = async (scriptId: string) => {
    setRegenLoading(true)
    const res = await fetch(`/api/scripts/${scriptId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction: regenInstruction }),
    })
    if (res.ok) {
      setRegenDrawerOpen(null)
      setRegenInstruction('')
      // Remove from scripts cache so it re-fetches when done
      setScripts((prev) => {
        const next = { ...prev }
        delete next[scriptId]
        return next
      })
    }
    setRegenLoading(false)
  }

  const handleGenerateSingle = async (coType: string) => {
    setGeneratingSingle(coType)
    try {
      const res = await fetch(`/api/runs/${params.runId}/generate-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coType }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Failed to start generation')
      }
    } catch {
      alert('Failed to start generation')
    }
    setGeneratingSingle(null)
  }

  const handleExport = (scriptId: string, format: 'docx' | 'pdf') => {
    window.open(`/api/scripts/${scriptId}/export?format=${format}`)
  }

  const completedCount = runState?.scripts.filter((s) => s.status === 'complete' || s.status === 'done').length ?? 0
  const totalCount = runState?.scripts.length ?? 0
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isAllDone = runState?.status === 'COMPLETE' || runState?.status === 'FAILED'
  const currentlyGenerating = runState?.scripts.filter((s) => s.status === 'generating') ?? []

  const activeScript = runState?.scripts.find((s) => s.coType === activeTab)
  const activeScriptFull = activeScript ? scripts[activeScript.id] : null

  if (!runState) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-3" />
          <p className="text-gray-500">Connecting to generation stream...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress banner */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-semibold text-gray-900">
                {isAllDone ? 'Generation Complete' : 'Generating Content Objects'}
              </h2>
              <p className="text-sm text-gray-500">
                {completedCount} of {totalCount} complete
                {currentlyGenerating.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    · Currently: {currentlyGenerating.map((s) => CO_LABELS[s.coType] ?? s.coType).join(', ')}
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold ${isAllDone ? 'text-green-600' : 'text-brand-600'}`}>
                {progressPercent}%
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${isAllDone ? 'bg-green-500' : 'bg-brand-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Step pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {runState.scripts.map((s) => (
              <button
                key={s.coType}
                onClick={() => setActiveTab(s.coType)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeTab === s.coType
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : `border-gray-200 ${statusColor(s.status)}`
                }`}
              >
                {statusIcon(s.status)}
                {CO_LABELS[s.coType] ?? s.coType}
                <span className="opacity-60">· {statusLabel(s.status)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tab sidebar */}
        <div className="w-52 border-r border-gray-200 bg-white shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Content Objects</p>
          </div>
          <div className="p-2 space-y-1">
            {runState.scripts.map((s) => (
              <button
                key={s.coType}
                onClick={() => setActiveTab(s.coType)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                  activeTab === s.coType
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="shrink-0">{statusIcon(s.status)}</span>
                <div className="min-w-0">
                  <p className="truncate">{CO_LABELS[s.coType] ?? s.coType}</p>
                  <p className="text-xs text-gray-400 truncate">{statusLabel(s.status)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main script view */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {activeTab && activeScriptFull ? (
            <div className="max-w-4xl mx-auto p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {CO_LABELS[activeTab]} · v{activeScriptFull.version}
                  </h2>
                  <span className={`inline-block text-xs mt-1 px-2 py-0.5 rounded-full font-medium ${
                    activeScriptFull.reviewStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    activeScriptFull.reviewStatus === 'IN_REVIEW' ? 'bg-blue-100 text-blue-700' :
                    activeScriptFull.reviewStatus === 'REVISION_REQUESTED' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {activeScriptFull.reviewStatus}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button
                    className="btn-secondary text-xs"
                    onClick={() => setRegenDrawerOpen(activeScriptFull.id)}
                  >
                    <RefreshCw className="w-3 h-3" /> Regenerate
                  </button>
                  <button
                    className="btn-secondary text-xs"
                    onClick={() => handleExport(activeScriptFull.id, 'docx')}
                  >
                    <FileDown className="w-3 h-3" /> Word (.docx)
                  </button>
                  <button
                    className="btn-secondary text-xs"
                    onClick={() => handleExport(activeScriptFull.id, 'pdf')}
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                </div>
              </div>

              {/* Compliance flags */}
              {activeScriptFull.complianceSummary?.some((c) => c.status === 'flag') && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Standards Compliance Flags</p>
                  {activeScriptFull.complianceSummary
                    .filter((c) => c.status === 'flag')
                    .map((c, i) => (
                      <p key={i} className="text-xs text-yellow-700">• {c.criterion}: {c.note}</p>
                    ))}
                </div>
              )}

              {/* Script content */}
              <div className="card p-6 prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeScriptFull.scriptText}
                </ReactMarkdown>
              </div>
            </div>
          ) : activeTab ? (
            (() => {
              const s = runState.scripts.find((s) => s.coType === activeTab)
              return (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    {s?.status === 'failed' ? (
                      <>
                        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-4">Generation failed for {CO_LABELS[activeTab]}</p>
                        <button
                          className="btn-primary text-sm"
                          onClick={() => handleGenerateSingle(activeTab)}
                          disabled={generatingSingle === activeTab}
                        >
                          {generatingSingle === activeTab ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Queuing...</>
                          ) : (
                            <><Play className="w-4 h-4" /> Retry Generation</>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Generating {CO_LABELS[activeTab]}...</p>
                        <p className="text-xs text-gray-400 mt-1">This may take 30-60 seconds</p>
                      </>
                    )}
                  </div>
                </div>
              )
            })()
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Select a content object from the sidebar
            </div>
          )}
        </div>

        {/* Regeneration drawer */}
        {regenDrawerOpen && (
          <div className="w-80 border-l border-gray-200 bg-white p-4 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Regenerate</h3>
              <button onClick={() => setRegenDrawerOpen(null)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <label className="label">Revision Instruction (optional)</label>
            <textarea
              className="input resize-none h-28 text-sm mb-3"
              placeholder="e.g. Make examples simpler, add more worked examples, focus on grade-appropriate language..."
              value={regenInstruction}
              onChange={(e) => setRegenInstruction(e.target.value)}
            />
            <button
              className="btn-primary w-full justify-center"
              onClick={() => handleRegenerate(regenDrawerOpen)}
              disabled={regenLoading}
            >
              {regenLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</>
                : <><RefreshCw className="w-4 h-4" /> Regenerate</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
