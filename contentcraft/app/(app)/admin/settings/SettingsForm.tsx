'use client'

import { useState } from 'react'
import { Save, Plus, X } from 'lucide-react'

const DEFAULT_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Urdu',
  'Social Studies', 'Islamiat', 'Computer Science', 'Pakistan Studies',
  'Biology', 'Chemistry', 'Physics', 'Geography', 'History', 'Economics',
]

interface Settings {
  improvementTriggerThreshold: number
  improvementCycleCount: number
  maxSloHistory: number
  subjects: string[]
  grades: number[]
}

export default function SettingsForm({ settings }: { settings: Partial<Settings> }) {
  const [values, setValues] = useState<Settings>({
    improvementTriggerThreshold: settings.improvementTriggerThreshold ?? 3.5,
    improvementCycleCount: settings.improvementCycleCount ?? 10,
    maxSloHistory: settings.maxSloHistory ?? 10,
    subjects: Array.isArray(settings.subjects) ? settings.subjects : DEFAULT_SUBJECTS,
    grades: Array.isArray(settings.grades) ? settings.grades : Array.from({ length: 12 }, (_, i) => i + 1),
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newGrade, setNewGrade] = useState('')

  const updateNum = (key: keyof Pick<Settings, 'improvementTriggerThreshold' | 'improvementCycleCount' | 'maxSloHistory'>, val: string) =>
    setValues((prev) => ({ ...prev, [key]: parseFloat(val) }))

  const addSubject = () => {
    const s = newSubject.trim()
    if (s && !values.subjects.includes(s)) {
      setValues((prev) => ({ ...prev, subjects: [...prev.subjects, s] }))
      setNewSubject('')
    }
  }

  const removeSubject = (s: string) =>
    setValues((prev) => ({ ...prev, subjects: prev.subjects.filter((x) => x !== s) }))

  const addGrade = () => {
    const g = parseInt(newGrade)
    if (!isNaN(g) && g >= 1 && g <= 20 && !values.grades.includes(g)) {
      setValues((prev) => ({ ...prev, grades: [...prev.grades, g].sort((a, b) => a - b) }))
      setNewGrade('')
    }
  }

  const removeGrade = (g: number) =>
    setValues((prev) => ({ ...prev, grades: prev.grades.filter((x) => x !== g) }))

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const data = await res.json()
        setSaveError(data.error ?? 'Failed to save settings')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError('Network error saving settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Provider info */}
      <div className="card p-5 bg-blue-50 border-blue-100">
        <h2 className="font-semibold text-blue-900 mb-1">AI Configuration</h2>
        <p className="text-sm text-blue-700">
          AI provider and API key are configured via environment variables in your <span className="font-mono">.env</span> file.
          Set <span className="font-mono">AI_PROVIDER</span>, <span className="font-mono">OPENAI_API_KEY</span> or <span className="font-mono">ANTHROPIC_API_KEY</span>, and <span className="font-mono">AI_MODEL</span>, then restart the server.
        </p>
      </div>

      {/* Subjects */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Subjects</h2>
        <p className="text-xs text-gray-400 mb-4">
          These subjects appear in the generation form. Add or remove as needed.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {values.subjects.map((s) => (
            <span key={s} className="flex items-center gap-1 px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 rounded-full text-sm">
              {s}
              <button onClick={() => removeSubject(s)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1 text-sm"
            placeholder="Add new subject..."
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubject()}
          />
          <button className="btn-secondary text-sm" onClick={addSubject}>
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Grades */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Grade Levels</h2>
        <p className="text-xs text-gray-400 mb-4">
          These grade levels appear in the generation form.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {values.grades.map((g) => (
            <span key={g} className="flex items-center gap-1 px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-full text-sm">
              Grade {g}
              <button onClick={() => removeGrade(g)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            className="input w-32 text-sm"
            placeholder="Grade #"
            value={newGrade}
            min={1} max={20}
            onChange={(e) => setNewGrade(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGrade()}
          />
          <button className="btn-secondary text-sm" onClick={addGrade}>
            <Plus className="w-4 h-4" /> Add Grade
          </button>
        </div>
      </div>

      {/* Pipeline Settings */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Pipeline Settings</h2>

        <div>
          <label className="label">Feedback Improvement Trigger Threshold (1–5)</label>
          <p className="text-xs text-gray-400 mb-2">
            When the average score for a dimension drops below this value, an improvement proposal is triggered.
          </p>
          <input
            type="number" min="1" max="5" step="0.1"
            className="input w-32"
            value={values.improvementTriggerThreshold}
            onChange={(e) => updateNum('improvementTriggerThreshold', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Number of Feedback Cycles Before Proposal</label>
          <p className="text-xs text-gray-400 mb-2">
            Minimum number of reviews that must be collected before a proposal is generated.
          </p>
          <input
            type="number" min="1" max="100" step="1"
            className="input w-32"
            value={values.improvementCycleCount}
            onChange={(e) => updateNum('improvementCycleCount', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Max SLO History Shown</label>
          <p className="text-xs text-gray-400 mb-2">
            Number of recent SLOs shown in the generation form typeahead.
          </p>
          <input
            type="number" min="1" max="50" step="1"
            className="input w-32"
            value={values.maxSloHistory}
            onChange={(e) => updateNum('maxSloHistory', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
        {saved && <span className="text-sm text-green-600">Settings saved!</span>}
        {saveError && <span className="text-sm text-red-600">{saveError}</span>}
      </div>
    </div>
  )
}
