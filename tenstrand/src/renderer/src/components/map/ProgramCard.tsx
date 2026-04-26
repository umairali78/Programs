import { X, MapPin, DollarSign, Users, Clock, BookOpen, Star } from 'lucide-react'
import { useMapStore } from '@/store/map.store'
import { useQuery } from '../hooks/useQuery'
import { invoke } from '@/lib/api'
import { parseJsonArray, formatCost, formatDistance, getPartnerTypeName } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'
import { useState, useEffect } from 'react'

interface ProgramDetail {
  id: string
  partnerId: string
  partnerName: string
  title: string
  description: string | null
  cost: number | null
  gradeLevels: string | null
  subjects: string | null
  season: string | null
  maxStudents: number | null
  durationMins: number | null
  lat: number | null
  lng: number | null
  standards: { standardCode: string; standardDesc: string | null; framework: string | null }[]
}

export function ProgramCard() {
  const { selectedProgramId, closePanel, panelOpen } = useMapStore()
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)

  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)

  const { data: program, loading } = useQuery<ProgramDetail>(
    selectedProgramId ? `program:get:${selectedProgramId}` : null,
    () => invoke('program:get', { id: selectedProgramId })
  )

  useEffect(() => {
    if (!program || !activeTeacher || !hasClaudeKey) {
      setAiExplanation(null)
      return
    }

    setLoadingAi(true)
    invoke('ai:matchExplanation', { teacherId: activeTeacher.id, programId: program.id })
      .then((result: string | null) => setAiExplanation(result))
      .catch(() => setAiExplanation(null))
      .finally(() => setLoadingAi(false))
  }, [program?.id, activeTeacher?.id, hasClaudeKey])

  if (!panelOpen || !selectedProgramId) return null

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-10 flex flex-col slide-in-right border-l border-app-border">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-app-border">
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4 mb-2" />
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-0.5">{program?.partnerName}</p>
              <h3 className="text-sm font-semibold text-gray-900 leading-tight">{program?.title}</h3>
            </>
          )}
        </div>
        <button
          onClick={closePanel}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 ml-2 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* AI explanation */}
      {(aiExplanation || loadingAi) && (
        <div className="mx-4 mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
          {loadingAi ? (
            <div className="space-y-1.5">
              <div className="h-3 bg-purple-100 rounded animate-pulse w-full" />
              <div className="h-3 bg-purple-100 rounded animate-pulse w-2/3" />
            </div>
          ) : (
            <div className="flex gap-2">
              <Star className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-700">{aiExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : program ? (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2">
              <Stat icon={DollarSign} label="Cost" value={formatCost(program.cost)} />
              <Stat
                icon={Users}
                label="Group size"
                value={program.maxStudents ? `Up to ${program.maxStudents}` : '—'}
              />
              <Stat
                icon={Clock}
                label="Duration"
                value={
                  program.durationMins
                    ? `${Math.round(program.durationMins / 60)}h ${program.durationMins % 60 > 0 ? `${program.durationMins % 60}m` : ''}`
                    : '—'
                }
              />
              <Stat
                icon={BookOpen}
                label="Grades"
                value={parseJsonArray(program.gradeLevels).join(', ') || '—'}
              />
            </div>

            {/* Description */}
            {program.description && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">About</p>
                <p className="text-xs text-gray-600 leading-relaxed">{program.description}</p>
              </div>
            )}

            {/* Subjects */}
            {(() => {
              const subjects = parseJsonArray(program.subjects)
              return subjects.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1.5">Subjects</p>
                  <div className="flex flex-wrap gap-1">
                    {subjects.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-brand-light text-brand text-xs rounded-full font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null
            })()}

            {/* Season */}
            {(() => {
              const seasons = parseJsonArray(program.season)
              return seasons.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1.5">Best Season</p>
                  <div className="flex flex-wrap gap-1">
                    {seasons.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-sky/10 text-sky text-xs rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null
            })()}

            {/* Standards */}
            {program.standards && program.standards.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">CA Standards</p>
                <div className="space-y-1">
                  {program.standards.map((s) => (
                    <div key={s.standardCode} className="flex gap-2 items-start">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded font-mono shrink-0">
                        {s.standardCode}
                      </span>
                      {s.standardDesc && (
                        <p className="text-[11px] text-gray-500 leading-tight">{s.standardDesc}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-gray-400 leading-none mb-0.5">{label}</p>
        <p className="text-xs font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )
}
