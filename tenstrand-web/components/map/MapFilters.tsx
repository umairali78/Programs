'use client'
import { Filter, RotateCcw, Search, Trees, BookOpen, School } from 'lucide-react'
import { useMapStore } from '@/store/map.store'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

const GRADE_BANDS = ['TK-2', '3-5', '6-8', '9-12']
const SUBJECTS = ['Life Science', 'Earth Science', 'Agriculture', 'Water', 'Biodiversity', 'Climate Justice', 'Indigenous Ecological Knowledge']
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter']
const RADIUS_OPTIONS = [5, 10, 20, 30, 50]

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('px-2 py-0.5 rounded-full text-xs font-medium border transition-colors', active ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand')}>
      {label}
    </button>
  )
}

function LayerToggle({ icon: Icon, label, active, color, onClick }: { icon: any; label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-colors w-full', active ? `border-transparent text-white` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')} style={active ? { backgroundColor: color } : {}}>
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}</span>
    </button>
  )
}

export function MapFiltersPanel() {
  const { filters, setFilters, resetFilters, radiusMiles, setRadius, searchQuery, setSearchQuery, showPartners, showPrograms, showSchools, setShowPartners, setShowPrograms, setShowSchools } = useMapStore()
  const searchRef = useRef<HTMLInputElement>(null)

  const toggleGrade = (g: string) => setFilters({ gradeBands: filters.gradeBands.includes(g) ? filters.gradeBands.filter((x) => x !== g) : [...filters.gradeBands, g] })
  const toggleSubject = (s: string) => setFilters({ subjects: filters.subjects.includes(s) ? filters.subjects.filter((x) => x !== s) : [...filters.subjects, s] })
  const toggleSeason = (s: string) => setFilters({ seasons: filters.seasons.includes(s) ? filters.seasons.filter((x) => x !== s) : [...filters.seasons, s] })

  const hasActiveFilters = filters.gradeBands.length > 0 || filters.subjects.length > 0 || filters.seasons.length > 0 || filters.cost !== 'all' || filters.groupSize !== 'all'

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearch = (v: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(v), 200)
  }

  return (
    <div className="w-56 shrink-0 bg-white border-r border-app-border flex flex-col overflow-hidden">
      {/* Search */}
      <div className="px-3 py-2.5 border-b border-app-border">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search partners & programs…"
            defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none min-w-0"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); if (searchRef.current) searchRef.current.value = '' }} className="text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>
      </div>

      {/* Layer toggles */}
      <div className="px-3 py-2.5 border-b border-app-border">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Map Layers</p>
        <div className="space-y-1">
          <LayerToggle icon={Trees} label="Partners" active={showPartners} color="#1B6B3A" onClick={() => setShowPartners(!showPartners)} />
          <LayerToggle icon={BookOpen} label="Programs" active={showPrograms} color="#2D6A4F" onClick={() => setShowPrograms(!showPrograms)} />
          <LayerToggle icon={School} label="Schools" active={showSchools} color="#4F46E5" onClick={() => setShowSchools(!showSchools)} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-app-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700"><Filter className="w-3.5 h-3.5" />Filters</div>
        {hasActiveFilters && <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand"><RotateCcw className="w-3 h-3" />Reset</button>}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Search Radius</p>
          <div className="flex flex-wrap gap-1">{RADIUS_OPTIONS.map((r) => <Chip key={r} label={`${r}mi`} active={radiusMiles === r} onClick={() => setRadius(r)} />)}</div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Grade Band</p>
          <div className="flex flex-wrap gap-1">{GRADE_BANDS.map((g) => <Chip key={g} label={g} active={filters.gradeBands.includes(g)} onClick={() => toggleGrade(g)} />)}</div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Subject</p>
          <div className="flex flex-wrap gap-1">{SUBJECTS.map((s) => <Chip key={s} label={s} active={filters.subjects.includes(s)} onClick={() => toggleSubject(s)} />)}</div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Season</p>
          <div className="flex flex-wrap gap-1">{SEASONS.map((s) => <Chip key={s} label={s} active={filters.seasons.includes(s)} onClick={() => toggleSeason(s)} />)}</div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Cost</p>
          <div className="flex flex-wrap gap-1">
            {(['all', 'free', 'low', 'moderate'] as const).map((c) => (
              <Chip key={c} label={c === 'all' ? 'Any' : c === 'free' ? 'Free' : c === 'low' ? '<$10' : 'Moderate'} active={filters.cost === c} onClick={() => setFilters({ cost: c })} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Group Size</p>
          <div className="flex flex-wrap gap-1">
            {(['all', '<30', '30-60', '60+'] as const).map((g) => (
              <Chip key={g} label={g === 'all' ? 'Any' : g} active={filters.groupSize === g} onClick={() => setFilters({ groupSize: g })} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
