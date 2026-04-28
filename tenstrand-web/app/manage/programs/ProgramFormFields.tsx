'use client'

const GRADE_LEVELS = ['TK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SUBJECTS = ['Life Science', 'Earth Science', 'Agriculture', 'Water', 'Biodiversity', 'Climate Justice', 'Indigenous Ecological Knowledge']
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter']

interface Props {
  partners: { id: string; name: string }[]
  defaults?: {
    partnerId?: string
    title?: string
    description?: string
    gradeLevels?: string[]
    subjects?: string[]
    season?: string[]
    cost?: number | null
    maxStudents?: number | null
    durationMins?: number | null
  }
}

function ChipGroup({ prefix, options, selected }: { prefix: string; options: string[]; selected: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <label key={opt} className="cursor-pointer">
          <input type="checkbox" name={`${prefix}:${opt}`} defaultChecked={selected.includes(opt)} className="sr-only peer" />
          <span className="px-2.5 py-1 rounded-full text-xs border border-gray-200 text-gray-600 bg-white peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand transition-colors select-none">
            {opt}
          </span>
        </label>
      ))}
    </div>
  )
}

const inputClass = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand bg-white'

export function ProgramFormFields({ partners, defaults = {} }: Props) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Partner *</label>
        <select name="partnerId" required defaultValue={defaults.partnerId ?? ''} className={inputClass}>
          <option value="" disabled>Select partner…</option>
          {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Program Title *</label>
        <input name="title" required defaultValue={defaults.title ?? ''} className={inputClass} placeholder="Watershed Explorers" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea name="description" rows={4} defaultValue={defaults.description ?? ''} className={inputClass} placeholder="What will students experience and learn?" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Grade Levels</label>
        <ChipGroup prefix="grade" options={GRADE_LEVELS} selected={defaults.gradeLevels ?? []} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Subjects</label>
        <ChipGroup prefix="subject" options={SUBJECTS} selected={defaults.subjects ?? []} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Season</label>
        <ChipGroup prefix="season" options={SEASONS} selected={defaults.season ?? []} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Cost ($)</label>
          <input name="cost" type="number" min="0" step="0.50" defaultValue={defaults.cost ?? ''} className={inputClass} placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Max Students</label>
          <input name="maxStudents" type="number" min="1" defaultValue={defaults.maxStudents ?? ''} className={inputClass} placeholder="30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Duration (min)</label>
          <input name="durationMins" type="number" min="30" defaultValue={defaults.durationMins ?? ''} className={inputClass} placeholder="120" />
        </div>
      </div>
    </>
  )
}
