'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle, X, Search, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadedDoc {
  id: string
  name: string
  size: number
  status: 'uploading' | 'processing' | 'ready' | 'error'
  pages?: number
  chunkCount?: number
  category?: string
  tags: string[]
  uploadedAt: Date
}

const CATEGORIES = ['Market Research', 'Regulatory', 'Trade Data', 'Pricing', 'Standards', 'Scientific', 'Internal']

const STATUS_CONFIG = {
  uploading: { icon: Loader2, cls: 'text-primary', label: 'Uploading…', spin: true },
  processing: { icon: Loader2, cls: 'text-amber-400', label: 'Processing…', spin: true },
  ready: { icon: CheckCircle, cls: 'text-emerald-400', label: 'Ready', spin: false },
  error: { icon: AlertTriangle, cls: 'text-destructive', label: 'Error', spin: false },
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function ReportBankPage() {
  const [docs, setDocs] = useState<UploadedDoc[]>([])
  const [dragging, setDragging] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/report-bank')
      .then(r => r.json())
      .then(d => {
        const documents = (d.documents ?? []).map((doc: Omit<UploadedDoc, 'uploadedAt'> & { uploadedAt: string }) => ({
          ...doc,
          uploadedAt: new Date(doc.uploadedAt),
        }))
        setDocs(documents)
      })
      .catch(() => {})
  }, [])

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files)
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv', 'text/markdown']

    for (const file of arr) {
      if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|xlsx|csv|txt|md|markdown)$/i)) continue

      const doc: UploadedDoc = {
        id: `doc-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        status: 'uploading',
        tags: [],
        uploadedAt: new Date(),
      }
      setDocs(prev => [doc, ...prev])

      try {
        const formData = new FormData()
        formData.append('file', file)

        setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'processing' } : d))

        const res = await fetch('/api/report-bank/upload', { method: 'POST', body: formData })
        const data = await res.json()

        if (!res.ok) throw new Error(data.error)

        setDocs(prev => prev.map(d => d.id === doc.id
          ? { ...d, status: 'ready', chunkCount: data.chunkCount, pages: data.pages, category: data.category, tags: data.tags ?? [] }
          : d
        ))
      } catch {
        setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'error' } : d))
      }
    }
  }, [])

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }

  const filtered = docs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Report Bank</h1>
          <p className="text-sm text-muted-foreground">Upload documents to power AI-assisted queries</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all',
          dragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/30'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.xlsx,.csv,.txt,.md,.markdown"
          multiple
          onChange={e => e.target.files && processFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
            dragging ? 'bg-primary/20' : 'bg-secondary')}>
            <Upload className={cn('w-7 h-7 transition-colors', dragging ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {dragging ? 'Drop to upload' : 'Drop files here or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, CSV, TXT, MD · Max 50 MB per file</p>
          </div>
        </div>
      </div>

      {/* What happens section */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[
          { step: '1', title: 'Upload', desc: 'Securely stored in Vercel Blob' },
          { step: '2', title: 'Process', desc: 'Text extracted → chunked → embedded' },
          { step: '3', title: 'Query', desc: 'AI retrieves relevant chunks automatically' },
        ].map(s => (
          <div key={s.step} className="rounded-xl border border-border bg-card p-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mx-auto mb-2">
              {s.step}
            </div>
            <p className="text-xs font-semibold">{s.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Document list */}
      {docs.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Documents ({docs.length})</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-secondary border border-border focus:outline-none focus:border-primary/50 transition-all w-48"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map(doc => {
              const cfg = STATUS_CONFIG[doc.status]
              const Icon = cfg.icon
              return (
                <div key={doc.id} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{formatBytes(doc.size)}</span>
                      {doc.chunkCount && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{doc.chunkCount} chunks</span>
                        </>
                      )}
                      {doc.tags.length > 0 && doc.tags.map(t => (
                        <span key={t} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] text-muted-foreground">
                          <Tag className="w-2 h-2" />{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={cn('flex items-center gap-1.5 text-xs font-medium shrink-0', cfg.cls)}>
                    <Icon className={cn('w-3.5 h-3.5', cfg.spin && 'animate-spin')} />
                    {cfg.label}
                  </div>
                  <button
                    onClick={() => setDocs(prev => prev.filter(d => d.id !== doc.id))}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Demo documents teaser */}
      {docs.length === 0 && (
        <div className="mt-6 p-4 rounded-xl border border-border bg-secondary/30">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            Demo mode: Upload any seaweed industry report, regulatory document, or trade data file.
            BlueBonzo will extract text, create semantic embeddings, and make it searchable via AI queries.
          </p>
        </div>
      )}
    </div>
  )
}
