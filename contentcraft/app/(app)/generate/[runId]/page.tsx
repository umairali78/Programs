'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { RefreshCw, Download, CheckCircle, AlertCircle, Clock, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react'

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

export default function GenerationOutputPage({ params }: { params: { runId: string } }) {
  const [runState, setRunState] = useState<RunState | null>(null)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [scripts, setScripts] = useState<Record<string, Script>>({})
  const [briefOpen, setBriefOpen] = useState(false)
  const [regenDrawerOpen, setRegenDrawerOpen] = useState<string | null>(null)
  const [regenInstruction, setRegenInstruction] = useState('')

  // SSE for real-time progress
  useEffect(() => {
    const es = new EventSource(`/api/runs/${params.runId}/stream`)
    es.onmessage = (e) => {
      const data: RunState = JSON.parse(e.data)
      setRunState(data)
      if (!activeTab && data.scripts.length > 0) {
        setActiveTab(data.scripts[0].coType)
      }
      // Fetch any newly completed scripts
      for (const s of data.scripts) {
        if ((s.status === 'complete' || s.status === 'failed') && !scripts[s.id]) {
          fetchScript(s.id)
        }
      }
    }
    es.onerror = () => es.close()
    return () => es.close()
  }, [params.runId])

  const fetchScript = async (scriptId: string) => {
    const res = await fetch(`/api/scripts/${scriptId}`)
    if (res.ok) {
      const data = await res.json()
      setScripts((prev) => ({ ...prev, [scriptId]: data }))
    }
  }

  const handleRegenerate = async (scriptId: string) => {
    const res = await fetch(`/api/scripts/${scriptId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction: regenInstruction }),
    })
    if (res.ok) {
      setRegenDrawerOpen(null)
      setRegenInstruction('')
    }
  }

  const handleExport = (scriptId: string, format: 'docx' | 'pdf') => {
    window.open(`/api/scripts/${scriptId}/export?format=${format}`)
  }

  const activeScript = runState?.scripts.find((s) => s.coType === activeTab)
  const activeScriptFull = activeScript ? scripts[activeScript.id] : null

  const statusIcon = (status: string) => {
    switch (status) {
      case 'done': case 'complete': return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'failed': return <AlertCircle className="w-3 h-3 text-red-500" />
      case 'queued': return <Clock className="w-3 h-3 text-gray-400" />
      default: return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
    }
  }

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
    <div className="flex h-full">
      {/* Tab sidebar */}
      <div className="w-48 border-r border-gray-200 bg-white shrink-0 overflow-y-auto">
        <div className="p-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Content Objects</p>
        </div>
        <div className="p-2 space-y-1">
          {runState.scripts.map((s) => (
            <button
              key={s.coType}
              onClick={() => setActiveTab(s.coType)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                activeTab === s.coType
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {statusIcon(s.status)}
              <span className="truncate">{CO_LABELS[s.coType] ?? s.coType}</span>
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
                <h2 className="font-semibold text-gray-900">{CO_LABELS[activeTab]} · v{activeScriptFull.version}</h2>
                <span className={`text-xs mt-1 ${
                  activeScriptFull.reviewStatus === 'APPROVED' ? 'badge-approved' :
                  activeScriptFull.reviewStatus === 'IN_REVIEW' ? 'badge-review' :
                  activeScriptFull.reviewStatus === 'REVISION_REQUESTED' ? 'badge-revision' : 'badge-draft'
                }`}>{activeScriptFull.reviewStatus}</span>
              </div>
              <div className="flex gap-2">
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
                  <Download className="w-3 h-3" /> .docx
                </button>
                <button
                  className="btn-secondary text-xs"
                  onClick={() => handleExport(activeScriptFull.id, 'pdf')}
                >
                  <Download className="w-3 h-3" /> .pdf
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
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Generating {CO_LABELS[activeTab]}...</p>
            </div>
          </div>
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
            <button onClick={() => setRegenDrawerOpen(null)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <label className="label">Instruction (optional)</label>
          <textarea
            className="input resize-none h-28 text-sm mb-3"
            placeholder="e.g. Make examples simpler, add more worked examples..."
            value={regenInstruction}
            onChange={(e) => setRegenInstruction(e.target.value)}
          />
          <button
            className="btn-primary w-full justify-center"
            onClick={() => handleRegenerate(regenDrawerOpen)}
          >
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>
        </div>
      )}
    </div>
  )
}
