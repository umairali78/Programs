'use client'
import { X, DollarSign, Users, Clock, BookOpen, Star, GraduationCap, School } from 'lucide-react'
import { useMapStore } from '@/store/map.store'
import { useQuery } from '../hooks/useQuery'
import { invoke } from '@/lib/api'
import { parseJsonArray, formatCost } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ProgramDetail {
  id: string; partnerId: string; title: string; description: string | null
  cost: number | null; gradeLevels: string | null; subjects: string | null
  season: string | null; maxStudents: number | null; durationMins: number | null
  lat: number | null; lng: number | null
  standards: { standardCode: string; standardDesc: string | null; framework: string | null }[]
}

interface NearbyTeacher { id: string; name: string; grade_levels: string | null; subjects: string | null; school_name: string | null; enrollment: number | null; school_city: string | null; distanceMiles: number; gradeMatch: boolean; subjectMatch: boolean }
interface NearbySchool { id: string; name: string; enrollment: number | null; city: string | null; county: string | null; distanceMiles: number }

type Tab = 'info' | 'teachers' | 'students'

export function ProgramCard() {
  const { selectedProgramId, closePanel, panelOpen, radiusMiles } = useMapStore()
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [tab, setTab] = useState<Tab>('info')
  const [teachers, setTeachers] = useState<NearbyTeacher[]>([])
  const [schools, setSchools] = useState<NearbySchool[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [loadingSchools, setLoadingSchools] = useState(false)

  const { data: program, loading } = useQuery<ProgramDetail>(
    selectedProgramId ? `program:get:${selectedProgramId}` : null,
    () => invoke('program:get', { id: selectedProgramId })
  )

  useEffect(() => {
    if (!program || !activeTeacher || !hasClaudeKey) { setAiExplanation(null); return }
    setLoadingAi(true)
    invoke('ai:matchExplanation', { teacherId: activeTeacher.id, programId: program.id })
      .then((r: string | null) => setAiExplanation(r))
      .catch(() => setAiExplanation(null))
      .finally(() => setLoadingAi(false))
  }, [program?.id, activeTeacher?.id, hasClaudeKey])

  useEffect(() => {
    if (!selectedProgramId) return
    setTab('info')
    setTeachers([])
    setSchools([])
  }, [selectedProgramId])

  const loadTeachers = async () => {
    if (teachers.length > 0 || !selectedProgramId) return
    setLoadingTeachers(true)
    try {
      const data = await invoke<NearbyTeacher[]>('insights:nearbyTeachers', { programId: selectedProgramId, radiusMiles })
      setTeachers(data)
    } catch {}
    finally { setLoadingTeachers(false) }
  }

  const loadSchools = async () => {
    if (schools.length > 0 || !selectedProgramId) return
    setLoadingSchools(true)
    try {
      const data = await invoke<NearbySchool[]>('insights:nearbySchools', { programId: selectedProgramId, radiusMiles })
      setSchools(data)
    } catch {}
    finally { setLoadingSchools(false) }
  }

  const handleTab = (t: Tab) => {
    setTab(t)
    if (t === 'teachers') loadTeachers()
    if (t === 'students') loadSchools()
  }

  const totalEnrollment = schools.reduce((sum, s) => sum + (s.enrollment ?? 0), 0)

  if (!panelOpen || !selectedProgramId) return null

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-[900] flex flex-col slide-in-right border-l border-app-border">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-app-border">
        <div className="flex-1 min-w-0">
          {loading ? <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4 mb-2" /> : (
            <>
              <p className="text-xs text-gray-500 mb-0.5">{(program as any)?.partnerName}</p>
              <h3 className="text-sm font-semibold text-gray-900 leading-tight">{program?.title}</h3>
            </>
          )}
        </div>
        <button onClick={closePanel} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 ml-2 shrink-0"><X className="w-4 h-4" /></button>
      </div>

      {/* AI explanation */}
      {(aiExplanation || loadingAi) && (
        <div className="mx-4 mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
          {loadingAi
            ? <div className="space-y-1.5"><div className="h-3 bg-purple-100 rounded animate-pulse w-full" /><div className="h-3 bg-purple-100 rounded animate-pulse w-2/3" /></div>
            : <div className="flex gap-2"><Star className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" /><p className="text-xs text-purple-700">{aiExplanation}</p></div>
          }
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-app-border mt-3 px-4">
        {([['info', 'Program', BookOpen], ['teachers', 'Teachers', GraduationCap], ['students', 'Schools', School]] as [Tab, string, any][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => handleTab(id)} className={cn('flex items-center gap-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px', tab === id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      {/* Tab: Program Info */}
      {tab === 'info' && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : program ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat icon={DollarSign} label="Cost" value={formatCost(program.cost)} />
                <Stat icon={Users} label="Group size" value={program.maxStudents ? `Up to ${program.maxStudents}` : '—'} />
                <Stat icon={Clock} label="Duration" value={program.durationMins ? `${Math.floor(program.durationMins / 60)}h${program.durationMins % 60 ? ` ${program.durationMins % 60}m` : ''}` : '—'} />
                <Stat icon={BookOpen} label="Grades" value={parseJsonArray(program.gradeLevels).join(', ') || '—'} />
              </div>

              {program.description && <div><p className="text-xs font-semibold text-gray-700 mb-1">About</p><p className="text-xs text-gray-600 leading-relaxed">{program.description}</p></div>}

              {parseJsonArray(program.subjects).length > 0 && (
                <div><p className="text-xs font-semibold text-gray-700 mb-1.5">Subjects</p>
                  <div className="flex flex-wrap gap-1">{parseJsonArray(program.subjects).map(s => <span key={s} className="px-2 py-0.5 bg-brand-light text-brand text-xs rounded-full font-medium">{s}</span>)}</div>
                </div>
              )}

              {parseJsonArray(program.season).length > 0 && (
                <div><p className="text-xs font-semibold text-gray-700 mb-1.5">Season</p>
                  <div className="flex flex-wrap gap-1">{parseJsonArray(program.season).map(s => <span key={s} className="px-2 py-0.5 bg-sky/10 text-sky text-xs rounded-full font-medium">{s}</span>)}</div>
                </div>
              )}

              {program.standards?.length > 0 && (
                <div><p className="text-xs font-semibold text-gray-700 mb-1.5">CA Standards</p>
                  <div className="space-y-1">
                    {program.standards.map(s => (
                      <div key={s.standardCode} className="flex gap-2 items-start">
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded font-mono shrink-0">{s.standardCode}</span>
                        {s.standardDesc && <p className="text-[11px] text-gray-500 leading-tight">{s.standardDesc}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Tab: Nearby Teachers */}
      {tab === 'teachers' && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {loadingTeachers ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8 text-gray-400"><GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-xs">No teachers with school coordinates found within {radiusMiles}mi.</p></div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3">{teachers.length} teacher{teachers.length !== 1 ? 's' : ''} within {radiusMiles} miles</p>
              <div className="space-y-2">
                {teachers.map(t => (
                  <div key={t.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{t.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{t.school_name ?? '—'}{t.school_city ? `, ${t.school_city}` : ''}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">{t.distanceMiles}mi</span>
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      {t.gradeMatch && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-medium">Grade match</span>}
                      {t.subjectMatch && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-medium">Subject match</span>}
                    </div>
                    {parseJsonArray(t.grade_levels).length > 0 && (
                      <p className="text-[11px] text-gray-400 mt-1">Gr. {parseJsonArray(t.grade_levels).join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Potential Students (Schools) */}
      {tab === 'students' && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {loadingSchools ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : schools.length === 0 ? (
            <div className="text-center py-8 text-gray-400"><School className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-xs">No schools with coordinates found within {radiusMiles}mi.</p></div>
          ) : (
            <>
              <div className="mb-3 p-3 bg-brand-light rounded-lg">
                <p className="text-xs font-semibold text-brand">{schools.length} schools nearby</p>
                {totalEnrollment > 0 && <p className="text-[11px] text-brand/80 mt-0.5">{totalEnrollment.toLocaleString()} potential students within {radiusMiles}mi</p>}
              </div>
              <div className="space-y-2">
                {schools.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{s.name}</p>
                      <p className="text-[11px] text-gray-400">{s.city ?? ''}{s.county ? ` · ${s.county} Co.` : ''}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      {s.enrollment && <p className="text-xs font-semibold text-gray-700">{s.enrollment.toLocaleString()}</p>}
                      <p className="text-[10px] text-gray-400">{s.distanceMiles}mi</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
      <div><p className="text-[10px] text-gray-400 leading-none mb-0.5">{label}</p><p className="text-xs font-medium text-gray-800">{value}</p></div>
    </div>
  )
}
