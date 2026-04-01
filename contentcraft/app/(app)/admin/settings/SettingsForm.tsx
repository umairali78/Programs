'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'

interface Settings {
  improvementTriggerThreshold: number
  improvementCycleCount: number
  maxSloHistory: number
}

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [values, setValues] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const update = (key: keyof Settings, val: string) =>
    setValues((prev) => ({ ...prev, [key]: parseFloat(val) }))

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <label className="label">Feedback Improvement Trigger Threshold (1–5)</label>
        <p className="text-xs text-gray-400 mb-2">
          When the average score for a dimension drops below this value, an improvement proposal is triggered.
        </p>
        <input
          type="number" min="1" max="5" step="0.1"
          className="input w-32"
          value={values.improvementTriggerThreshold}
          onChange={(e) => update('improvementTriggerThreshold', e.target.value)}
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
          onChange={(e) => update('improvementCycleCount', e.target.value)}
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
          onChange={(e) => update('maxSloHistory', e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
      </div>
    </div>
  )
}
