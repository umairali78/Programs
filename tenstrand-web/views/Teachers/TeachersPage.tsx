'use client'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, GraduationCap, MapPin, Plus, Search, School, Users } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { useAppStore } from '@/store/app.store'
import { parseJsonArray } from '@/lib/utils'
import { toast } from 'sonner'
import { TeacherForm } from '@/components/teachers/TeacherForm'

const GRADE_BANDS: Record<string, string[]> = {
  'TK-2': ['TK', 'K', '1', '2'],
  '3-5': ['3', '4', '5'],
  '6-8': ['6', '7', '8'],
  '9-12': ['9', '10', '11', '12'],
}

interface TeacherRow {
  id: string
  name: string
  email: string | null
  grade_levels: string | null
  gradeLevels?: string | null
  subjects: string | null
  school_name: string | null
  schoolName?: string | null
  enrollment: number | null
  school_city: string | null
  school_county: string | null
  school_lat: number | null
  school_lng: number | null
}

interface SchoolOption { id: string; name: string; city: string | null; county: string | null; lat: number | null; lng: number | null }

export function TeachersPage() {
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const setActiveTeacher = useAppStore((s) => s.setActiveTeacher)
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('all')
  const [gradeBand, setGradeBand] = useState('all')
  const [county, setCounty] = useState('all')
  const [location, setLocation] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      invoke<TeacherRow[]>('insights:teachersWithSchool'),
      invoke<SchoolOption[]>('insights:schoolsForMap'),
    ]).then(([teacherRows, schoolRows]) => {
      setTeachers(teacherRows)
      setSchools(schoolRows)
    }).catch(() => toast.error('Failed to load teachers'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const subjects = useMemo(() => Array.from(new Set(teachers.flatMap((t) => parseJsonArray(t.subjects)))).sort(), [teachers])
  const counties = useMemo(() => Array.from(new Set(teachers.map((t) => t.school_county).filter(Boolean) as string[])).sort(), [teachers])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teachers.filter((t) => {
      const grades = parseJsonArray(t.grade_levels ?? t.gradeLevels)
      const located = t.school_lat != null && t.school_lng != null
      if (subject !== 'all' && !parseJsonArray(t.subjects).includes(subject)) return false
      if (gradeBand !== 'all' && !GRADE_BANDS[gradeBand]?.some((g) => grades.includes(g))) return false
      if (county !== 'all' && t.school_county !== county) return false
      if (location === 'mapped' && !located) return false
      if (location === 'unmapped' && located) return false
      if (!q) return true
      return [t.name, t.email, t.school_name, t.schoolName, t.school_city, t.school_county].some((v) => v?.toLowerCase().includes(q))
    })
  }, [teachers, query, subject, gradeBand, county, location])

  const totals = useMemo(() => ({
    teachers: teachers.length,
    schools: new Set(teachers.map((t) => t.school_name).filter(Boolean)).size,
    students: teachers.reduce((sum, t) => sum + (t.enrollment ?? 0), 0),
    located: teachers.filter((t) => t.school_lat != null && t.school_lng != null).length,
  }), [teachers])

  const activate = async (teacher: TeacherRow) => {
    try {
      await invoke('teacher:setActive', { id: teacher.id })
      setActiveTeacher({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        gradeLevels: teacher.grade_levels ?? teacher.gradeLevels ?? null,
        subjects: teacher.subjects,
        lat: teacher.school_lat,
        lng: teacher.school_lng,
      } as any)
      toast.success('Active teacher updated')
    } catch {
      toast.error('Failed to set active teacher')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Teachers">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors">
          <Plus className="w-3.5 h-3.5" />Add Teacher
        </button>
      </TopBar>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MiniStat icon={GraduationCap} label="Teachers" value={totals.teachers} />
          <MiniStat icon={School} label="Schools" value={totals.schools} />
          <MiniStat icon={Users} label="Potential Students" value={totals.students.toLocaleString()} />
          <MiniStat icon={MapPin} label="Located" value={totals.located} />
        </div>

        <div className="bg-white border border-app-border rounded-xl p-3 grid grid-cols-1 lg:grid-cols-[1fr_150px_120px_150px_130px] gap-2">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search teachers, schools, counties..." className="bg-transparent outline-none text-sm flex-1 min-w-0" />
          </div>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="all">All subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="all">All grades</option>
            {Object.keys(GRADE_BANDS).map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={county} onChange={(e) => setCounty(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="all">All counties</option>
            {counties.map((c) => <option key={c} value={c}>{c} County</option>)}
          </select>
          <select value={location} onChange={(e) => setLocation(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="all">Any location</option>
            <option value="mapped">Mapped</option>
            <option value="unmapped">Unmapped</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm font-medium">No teachers match those filters</p></div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {filtered.map((t) => {
              const grades = parseJsonArray(t.grade_levels ?? t.gradeLevels)
              const teacherSubjects = parseJsonArray(t.subjects)
              const isActive = activeTeacher?.id === t.id
              return (
                <div key={t.id} className="bg-white rounded-xl border border-app-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                      <p className="text-xs text-gray-500 truncate">{t.school_name ?? t.schoolName ?? 'No school assigned'}{t.school_city ? `, ${t.school_city}` : ''}</p>
                    </div>
                    <button onClick={() => activate(t)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${isActive ? 'bg-brand-light text-brand' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                      <CheckCircle2 className="w-3 h-3" />{isActive ? 'Active' : 'Set active'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {grades.slice(0, 6).map((g) => <span key={g} className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">Gr. {g}</span>)}
                    {teacherSubjects.slice(0, 4).map((s) => <span key={s} className="px-1.5 py-0.5 rounded-full bg-brand-light text-brand text-xs">{s}</span>)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                    {t.email && <span>{t.email}</span>}
                    {t.enrollment != null && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.enrollment.toLocaleString()} potential students</span>}
                    {(t.school_lat != null && t.school_lng != null) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Mapped</span>}
                    {teacherSubjects.length > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{teacherSubjects.length} interests</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {showForm && <TeacherForm schools={schools} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return <div className="bg-white border border-app-border rounded-xl p-4 flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center"><Icon className="w-4 h-4 text-brand" /></div><div><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div></div>
}
