'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'

export default function StandardsUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/standards/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok) {
      setResult(`Uploaded v${data.version} — embedding in progress. Chunks will be ready in ~2 minutes.`)
      setFile(null)
    } else {
      setResult(`Error: ${data.error}`)
    }
    setUploading(false)
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Upload New Standards Guide</h2>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="label">File (.docx or .pdf)</label>
          <input
            type="file"
            accept=".docx,.pdf"
            className="input text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-brand-50 file:text-brand-700"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={uploading || !file}>
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {result && (
        <p className={`mt-3 text-sm px-3 py-2 rounded-lg ${result.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
