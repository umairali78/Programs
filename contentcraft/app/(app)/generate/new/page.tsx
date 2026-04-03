'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, BookOpen, Settings } from 'lucide-react'
import Link from 'next/link'

const DEFAULT_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Urdu',
  'Social Studies', 'Islamiat', 'Computer Science', 'Pakistan Studies',
]

const DEFAULT_GRADES = Array.from({ length: 12 }, (_, i) => i + 1)

const CONTENT_OBJECTS = [
  { id: 'CO1', label: 'Model Chapter', desc: 'Primary instructional text' },
  { id: 'CO2', label: 'Reading Material', desc: 'Supplementary reading passage' },
  { id: 'CO3', label: 'Video Script', desc: 'Narration + visual direction script' },
  { id: 'CO4', label: 'Assessment', desc: 'Question bank with answer keys' },
  { id: 'CO5', label: 'Learning Game', desc: 'Gamified learning activity brief' },
  { id: 'CO6', label: 'Dictionary / Glossary', desc: 'Key terms at grade level' },
  { id: 'CO7', label: 'Teacher Guide', desc: 'Pedagogical support document' },
]

export default function NewGenerationPage() {
  const router = useRouter()
  const [sloText, setSloText] = useState('')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [curriculumContext] = useState('Pakistan NC')
  const [selectedCOs, setSelectedCOs] = useState<string[]>(CONTENT_OBJECTS.map((co) => co.id))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS)
  const [grades, setGrades] = useState<number[]>(DEFAULT_GRADES)

  // Load subjects and grades from settings
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.subjects && Array.isArray(data.subjects)) setSubjects(data.subjects)
        if (data?.grades && Array.isArray(data.grades)) setGrades(data.grades)
      })
      .catch(() => {}) // silently fall back to defaults
  }, [])

  const toggleCO = (id: string) => {
    setSelectedCOs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const isValid = sloText.trim().length > 0 && sloText.length <= 500
    && grade && subject && selectedCOs.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sloText: sloText.trim(),
          grade: parseInt(grade),
          subject,
          curriculumContext,
          selectedCOs,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start generation')

      router.push(`/generate/brief/${data.briefId}?selectedCOs=${selectedCOs.join(',')}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Content Generation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter the SLO and select which content objects to generate.
          </p>
        </div>
        <Link href="/admin/settings" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mt-1">
          <Settings className="w-3.5 h-3.5" />
          Manage subjects &amp; grades
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SLO Input */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Student Learning Outcome (SLO)</h2>
          <label className="label" htmlFor="slo">
            Paste or type the SLO from Pakistan National Curriculum
          </label>
          <textarea
            id="slo"
            className="input resize-none h-28"
            value={sloText}
            onChange={(e) => setSloText(e.target.value)}
            placeholder="e.g. Students will be able to identify and describe the water cycle including evaporation, condensation, and precipitation..."
            maxLength={500}
            required
          />
          <p className={`text-xs mt-1 ${sloText.length > 450 ? 'text-orange-500' : 'text-gray-400'}`}>
            {sloText.length}/500 characters
          </p>
        </div>

        {/* Grade + Subject */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Classification</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="grade">Grade Level</label>
              <select
                id="grade"
                className="input"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
              >
                <option value="">Select grade...</option>
                {grades.map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="subject">Subject</label>
              <select
                id="subject"
                className="input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              >
                <option value="">Select subject...</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Curriculum Context</label>
            <input className="input bg-gray-50" value="Pakistan National Curriculum" disabled />
          </div>
        </div>

        {/* Content Object Selection */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Content Objects</h2>
            <button
              type="button"
              className="text-xs text-brand-600 hover:underline"
              onClick={() =>
                setSelectedCOs(
                  selectedCOs.length === CONTENT_OBJECTS.length
                    ? []
                    : CONTENT_OBJECTS.map((co) => co.id)
                )
              }
            >
              {selectedCOs.length === CONTENT_OBJECTS.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CONTENT_OBJECTS.map((co) => {
              const checked = selectedCOs.includes(co.id)
              return (
                <label
                  key={co.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCO(co.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{co.label}</p>
                    <p className="text-xs text-gray-400">{co.desc}</p>
                  </div>
                </label>
              )
            })}
          </div>
          {selectedCOs.length === 0 && (
            <p className="text-xs text-red-500 mt-2">Select at least one content object.</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            You can also generate individual objects after reviewing the research brief.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
            disabled={!isValid || loading}
          >
            {loading ? 'Starting research...' : 'Start Generation'}
            {!loading && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  )
}
