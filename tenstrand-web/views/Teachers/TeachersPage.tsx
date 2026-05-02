'use client'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, GraduationCap, Globe, MapPin, MessageCircle, Plus, Search, School, Star, UserCheck, UserPlus, Users } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { useAppStore } from '@/store/app.store'
import { parseJsonArray } from '@/lib/utils'
import { toast } from 'sonner'
import { TeacherForm } from '@/components/teachers/TeacherForm'
import { Link } from 'react-router-dom'

const GRADE_BANDS: Record<string, string[]> = {
  'TK-2': ['TK', 'K', '1', '2'],
  '3-5': ['3', '4', '5'],
  '6-8': ['6', '7', '8'],
  '9-12': ['9', '10', '11', '12'],
}

const AVATAR_COLORS = ['#1B6B3A', '#2563EB', '#7C3AED', '#C2410C', '#0F766E', '#0369A1', '#B91C1C', '#065F46', '#92400E', '#1e40af']

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
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
  const [connected, setConnected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('all')
  const [gradeBand, setGradeBand] = useState('all')
  const [county, setCounty] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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

  const subjectList = useMemo(() => Array.from(new Set(teachers.flatMap((t) => parseJsonArray(t.subjects)))).sort(), [teachers])
  const countyList = useMemo(() => Array.from(new Set(teachers.map((t) => t.school_county).filter(Boolean) as string[])).sort(), [teachers])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teachers.filter((t) => {
      const grades = parseJsonArray(t.grade_levels ?? t.gradeLevels)
      if (subject !== 'all' && !parseJsonArray(t.subjects).includes(subject)) return false
      if (gradeBand !== 'all' && !GRADE_BANDS[gradeBand]?.some((g) => grades.includes(g))) return false
      if (county !== 'all' && t.school_county !== county) return false
      if (!q) return true
      return [t.name, t.email, t.school_name, t.schoolName, t.school_city, t.school_county].some((v) => v?.toLowerCase().includes(q))
    })
  }, [teachers, query, subject, gradeBand, county])

  const totals = useMemo(() => ({
    teachers: teachers.length,
    schools: new Set(teachers.map((t) => t.school_name).filter(Boolean)).size,
    students: teachers.reduce((sum, t) => sum + (t.enrollment ?? 0), 0),
    connected: connected.size,
  }), [teachers, connected])

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
      toast.success(`Active teacher set to ${teacher.name}`)
    } catch {
      toast.error('Failed to set active teacher')
    }
  }

  const toggleConnect = (id: string, name: string) => {
    setConnected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); toast.success(`Unfollowed ${name}`) }
      else { next.add(id); toast.success(`Now following ${name}!`) }
      return next
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Teacher Directory">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors">
          <Plus className="w-3.5 h-3.5" />Add Teacher
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-5">

        {/* Header banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-[#0d4a28] p-5 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Platform Community</p>
              <h2 className="text-xl font-bold mt-0.5">Climate Learning Teachers</h2>
              <p className="text-white/70 text-sm mt-1">{totals.teachers} educators across {totals.schools} schools in California</p>
            </div>
            <div className="flex gap-3">
              <Stat label="Teachers" value={totals.teachers} />
              <Stat label="Schools" value={totals.schools} />
              <Stat label="Students" value={`${Math.round(totals.students / 1000)}k+`} />
              <Stat label="Following" value={totals.connected} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-app-border rounded-xl p-3 flex flex-col lg:flex-row gap-2">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, school, or county…" className="bg-transparent outline-none text-sm flex-1 min-w-0" />
          </div>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-w-[130px]">
            <option value="all">All subjects</option>
            {subjectList.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-w-[110px]">
            <option value="all">All grades</option>
            {Object.keys(GRADE_BANDS).map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={county} onChange={(e) => setCounty(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-w-[130px]">
            <option value="all">All counties</option>
            {countyList.map((c) => <option key={c} value={c}>{c} County</option>)}
          </select>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
            <button onClick={() => setViewMode('grid')} className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Grid</button>
            <button onClick={() => setViewMode('list')} className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>List</button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-1'}`}>
            {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No teachers match those filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filtered.map((t) => <TeacherProfileCard key={t.id} teacher={t} isActive={activeTeacher?.id === t.id} isConnected={connected.has(t.id)} onActivate={() => activate(t)} onConnect={() => toggleConnect(t.id, t.name)} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => <TeacherListRow key={t.id} teacher={t} isActive={activeTeacher?.id === t.id} isConnected={connected.has(t.id)} onActivate={() => activate(t)} onConnect={() => toggleConnect(t.id, t.name)} />)}
          </div>
        )}
      </div>

      {showForm && <TeacherForm schools={schools} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}

function TeacherProfileCard({ teacher: t, isActive, isConnected, onActivate, onConnect }: {
  teacher: TeacherRow
  isActive: boolean
  isConnected: boolean
  onActivate: () => void
  onConnect: () => void
}) {
  const grades = parseJsonArray(t.grade_levels ?? t.gradeLevels)
  const teacherSubjects = parseJsonArray(t.subjects)
  const color = getAvatarColor(t.name)
  const initials = getInitials(t.name)
  const schoolName = t.school_name ?? t.schoolName ?? 'School not set'
  const location = [t.school_city, t.school_county ? `${t.school_county} County` : null].filter(Boolean).join(', ') || 'California'

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${isActive ? 'border-brand/40 ring-1 ring-brand/10' : 'border-gray-100'}`}>
      {/* Card header */}
      <div className="h-16 relative" style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)` }}>
        {isActive && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Star className="w-2.5 h-2.5 fill-white" />ACTIVE
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Avatar + name */}
        <div className="flex items-end justify-between -mt-6 mb-3">
          <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm flex items-center justify-center font-bold text-white text-sm"
            style={{ backgroundColor: color }}>
            {initials}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onConnect}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isConnected ? 'bg-brand-light text-brand border border-brand/30 hover:bg-red-50 hover:text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-brand hover:text-white'
              }`}
            >
              {isConnected ? <><UserCheck className="w-3 h-3" />Following</> : <><UserPlus className="w-3 h-3" />Follow</>}
            </button>
          </div>
        </div>

        <h3 className="text-sm font-bold text-gray-900">{t.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{schoolName}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-gray-400" />
          <p className="text-[11px] text-gray-400 truncate">{location}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {grades.slice(0, 5).map((g) => (
            <span key={g} className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium">Gr. {g}</span>
          ))}
          {teacherSubjects.slice(0, 3).map((s) => (
            <span key={s} className="px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-medium">{s}</span>
          ))}
          {(grades.length > 5 || teacherSubjects.length > 3) && (
            <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">+{grades.length - 5 + teacherSubjects.length - 3} more</span>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            {t.enrollment != null && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.enrollment.toLocaleString()} students</span>}
            {t.school_lat != null && <span className="flex items-center gap-1 text-green-600"><MapPin className="w-3 h-3" />Mapped</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/community" className="flex items-center gap-1 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View in community">
              <Globe className="w-3.5 h-3.5" />
            </Link>
            <button onClick={onActivate}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? 'bg-brand-light text-brand' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />{isActive ? 'Active' : 'Set active'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeacherListRow({ teacher: t, isActive, isConnected, onActivate, onConnect }: {
  teacher: TeacherRow
  isActive: boolean
  isConnected: boolean
  onActivate: () => void
  onConnect: () => void
}) {
  const grades = parseJsonArray(t.grade_levels ?? t.gradeLevels)
  const teacherSubjects = parseJsonArray(t.subjects)
  const color = getAvatarColor(t.name)
  const initials = getInitials(t.name)
  const schoolName = t.school_name ?? t.schoolName ?? 'School not set'

  return (
    <div className={`bg-white rounded-xl border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow ${isActive ? 'border-brand/40' : 'border-gray-100'}`}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0" style={{ backgroundColor: color }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900 truncate">{t.name}</p>
          {isActive && <span className="shrink-0 text-[10px] font-bold text-brand bg-brand-light px-1.5 py-0.5 rounded-full">Active</span>}
        </div>
        <p className="text-xs text-gray-500 truncate">{schoolName}{t.school_county ? ` · ${t.school_county} County` : ''}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {grades.slice(0, 4).map((g) => <span key={g} className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium">Gr. {g}</span>)}
          {teacherSubjects.slice(0, 2).map((s) => <span key={s} className="px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-medium">{s}</span>)}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onConnect}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            isConnected ? 'bg-brand-light text-brand' : 'bg-gray-100 text-gray-600 hover:bg-brand hover:text-white'
          }`}
        >
          {isConnected ? <><UserCheck className="w-3 h-3" />Following</> : <><UserPlus className="w-3 h-3" />Follow</>}
        </button>
        <button onClick={onActivate}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            isActive ? 'bg-brand-light text-brand' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />{isActive ? 'Active' : 'Set active'}
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/60">{label}</p>
    </div>
  )
}
