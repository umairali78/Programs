import { Filter, RotateCcw } from 'lucide-react'
import { useMapStore, MapFilters as MF } from '@/store/map.store'
import { cn } from '@/lib/utils'

const GRADE_BANDS = ['TK-2', '3-5', '6-8', '9-12']
const SUBJECTS = [
  'Life Science',
  'Earth Science',
  'Agriculture',
  'Water',
  'Biodiversity',
  'Climate Justice',
  'Indigenous Ecological Knowledge'
]
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter']
const RADIUS_OPTIONS = [5, 10, 20, 30, 50]

function Chip({
  label,
  active,
  onClick
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-brand text-white border-brand'
          : 'bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand'
      )}
    >
      {label}
    </button>
  )
}

export function MapFiltersPanel() {
  const { filters, setFilters, resetFilters, radiusMiles, setRadius } = useMapStore()

  const toggleGrade = (g: string) => {
    const next = filters.gradeBands.includes(g)
      ? filters.gradeBands.filter((x) => x !== g)
      : [...filters.gradeBands, g]
    setFilters({ gradeBands: next })
  }

  const toggleSubject = (s: string) => {
    const next = filters.subjects.includes(s)
      ? filters.subjects.filter((x) => x !== s)
      : [...filters.subjects, s]
    setFilters({ subjects: next })
  }

  const toggleSeason = (s: string) => {
    const next = filters.seasons.includes(s)
      ? filters.seasons.filter((x) => x !== s)
      : [...filters.seasons, s]
    setFilters({ seasons: next })
  }

  const hasActiveFilters =
    filters.gradeBands.length > 0 ||
    filters.subjects.length > 0 ||
    filters.seasons.length > 0 ||
    filters.cost !== 'all' ||
    filters.groupSize !== 'all'

  return (
    <div className="w-56 shrink-0 bg-white border-r border-app-border flex flex-col overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-app-border">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <Filter className="w-3.5 h-3.5" />
          Filters
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="p-3 space-y-4">
        {/* Radius */}
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Search Radius</p>
          <div className="flex flex-wrap gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <Chip
                key={r}
                label={`${r}mi`}
                active={radiusMiles === r}
                onClick={() => setRadius(r)}
              />
            ))}
          </div>
        </div>

        {/* Grade Band */}
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Grade Band</p>
          <div className="flex flex-wrap gap-1">
            {GRADE_BANDS.map((g) => (
              <Chip
                key={g}
                label={g}
                active={filters.gradeBands.includes(g)}
                onClick={() => toggleGrade(g)}
              />
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Subject</p>
          <div className="flex flex-wrap gap-1">
            {SUBJECTS.map((s) => (
              <Chip
                key={s}
                label={s}
                active={filters.subjects.includes(s)}
                onClick={() => toggleSubject(s)}
              />
            ))}
          </div>
        </div>

        {/* Season */}
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Season</p>
          <div className="flex flex-wrap gap-1">
            {SEASONS.map((s) => (
              <Chip
                key={s}
                label={s}
                active={filters.seasons.includes(s)}
                onClick={() => toggleSeason(s)}
              />
            ))}
          </div>
        </div>

        {/* Cost */}
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Cost</p>
          <div className="flex flex-wrap gap-1">
            {(['all', 'free', 'low', 'moderate'] as const).map((c) => (
              <Chip
                key={c}
                label={c === 'all' ? 'Any' : c === 'free' ? 'Free' : c === 'low' ? '<$10' : 'Moderate'}
                active={filters.cost === c}
                onClick={() => setFilters({ cost: c })}
              />
            ))}
          </div>
        </div>

        {/* Group Size */}
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Group Size</p>
          <div className="flex flex-wrap gap-1">
            {(['all', '<30', '30-60', '60+'] as const).map((g) => (
              <Chip
                key={g}
                label={g === 'all' ? 'Any' : g}
                active={filters.groupSize === g}
                onClick={() => setFilters({ groupSize: g })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
