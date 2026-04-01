'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ChevronDown, ChevronUp } from 'lucide-react'

interface PromptLib {
  id: string
  masterPrompt: string
  structuralRules: string
  outputFormat: string
  qualityCriteria: string
}

export default function PromptEditor({
  coType,
  existing,
}: {
  coType: string
  existing: PromptLib | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState({
    masterPrompt: existing?.masterPrompt ?? '',
    structuralRules: existing?.structuralRules ?? '',
    outputFormat: existing?.outputFormat ?? '',
    qualityCriteria: existing?.qualityCriteria ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentObjectType: coType, ...fields }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div>
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{open ? 'Hide editor' : 'Edit prompt library'}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-50 pt-4">
          {(
            [
              ['masterPrompt', 'Master Prompt', 'The core instruction that drives content generation for this type.'],
              ['structuralRules', 'Structural Rules', 'Section sequence, required components, and ordering constraints.'],
              ['outputFormat', 'Output Format', 'How the output should be formatted (Markdown structure, headers, etc.).'],
              ['qualityCriteria', 'Quality Criteria', 'What makes a high-quality output for this content type.'],
            ] as [keyof typeof fields, string, string][]
          ).map(([key, label, hint]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <p className="text-xs text-gray-400 mb-1">{hint}</p>
              <textarea
                className="input resize-none h-32 text-sm font-mono"
                value={fields[key]}
                onChange={set(key)}
              />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button className="btn-primary text-sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save & Version'}
            </button>
            {saved && <span className="text-sm text-green-600">Saved as new version!</span>}
          </div>
        </div>
      )}
    </div>
  )
}
