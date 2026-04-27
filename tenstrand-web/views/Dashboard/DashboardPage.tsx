'use client'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BookOpen, Compass, GraduationCap, Loader2, Map, School, Trees, Users } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { useAppStore } from '@/store/app.store'
import { formatCost, formatDistance, parseJsonArray, scoreToPercent } from '@/lib/utils'

interface Overview { partners: number; programs: number; teachers: number; schools: number; districts: number; activePartners: number; freePrograms: number; geocodedPartners: number }
interface ChartDatum { subject?: string; grade?: string; type?: string; label?: string; count: number }
interface MatchResult { programId: string; partnerName: string; title: string; description: string | null; cost: number | null; score: number; distanceMiles: number | null; gradeLevels: string[]; subjects: string[] }
interface TopProgram { id: string; title: string; partner_name: string; bookmark_count: number; engagement_count: number }
interface CountyCoverage { county: string; partners: number; programs: number }
interface TeacherOpportunity { matchedPrograms: number; reachableStudents: number; schoolName: string | null; nearbySchools: number }
interface TeacherOption { id: string; name: string; email: string | null; gradeLevels: string | null; subjects: string | null; lat: number | null; lng: number | null }

const COLORS = ['#1B6B3A', '#2563EB', '#C2410C', '#7C3AED', '#0F766E', '#B91C1C']

export function DashboardPage() {
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const setActiveTeacher = useAppStore((s) => s.setActiveTeacher)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [subjects, setSubjects] = useState<ChartDatum[]>([])
  const [grades, setGrades] = useState<ChartDatum[]>([])
  const [types, setTypes] = useState<ChartDatum[]>([])
  const [topPrograms, setTopPrograms] = useState<TopProgram[]>([])
  const [counties, setCounties] = useState<CountyCoverage[]>([])
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [opportunity, setOpportunity] = useState<TeacherOpportunity | null>(null)
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(true)
  const [changingTeacher, setChangingTeacher] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      invoke<any>('teacher:getActive').catch(() => null),
      invoke<TeacherOption[]>('teacher:list').catch(() => []),
    ])
      .then(([teacher, teacherRows]) => {
        if (cancelled) return
        setTeachers(teacherRows)
        if (teacher) setActiveTeacher(teacher)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [setActiveTeacher])

  const handleTeacherChange = async (id: string) => {
    setChangingTeacher(true)
    try {
      if (!id) {
        setActiveTeacher(null)
        return
      }
      await invoke('teacher:setActive', { id })
      const teacher = await invoke<any>('teacher:get', { id })
      setOpportunity(null)
      setMatches([])
      setActiveTeacher(teacher)
    } finally {
      setChangingTeacher(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      invoke<Overview>('insights:overview'),
      invoke<ChartDatum[]>('insights:programsBySubject'),
      invoke<ChartDatum[]>('insights:programsByGrade'),
      invoke<ChartDatum[]>('insights:partnerTypes'),
      invoke<TopProgram[]>('insights:topPrograms', { limit: 5 }),
      invoke<CountyCoverage[]>('insights:countyCoverage'),
      activeTeacher ? invoke<MatchResult[]>('match:listForTeacher', { teacherId: activeTeacher.id, radiusMiles: 20 }) : Promise.resolve([]),
      activeTeacher ? invoke<TeacherOpportunity>('insights:teacherOpportunity', { teacherId: activeTeacher.id, radiusMiles: 30 }) : Promise.resolve(null),
    ]).then(([o, s, g, t, top, c, m, summary]) => {
      if (cancelled) return
      setOverview(o); setSubjects(s); setGrades(g); setTypes(t); setTopPrograms(top); setCounties(c); setMatches(m.slice(0, 5)); setOpportunity(summary)
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeTeacher?.id, activeTeacher?.gradeLevels, activeTeacher?.subjects, activeTeacher?.lat, activeTeacher?.lng])

  const coverage = useMemo(() => {
    if (!overview?.partners) return 0
    return Math.round((overview.geocodedPartners / overview.partners) * 100)
  }, [overview])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{activeTeacher ? `Welcome back, ${activeTeacher.name.split(' ')[0]}` : 'Climate Learning Exchange'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{activeTeacher ? `Grades: ${parseJsonArray(activeTeacher.gradeLevels).join(', ') || 'Not set'} · Subjects: ${parseJsonArray(activeTeacher.subjects).join(', ') || 'Not set'}` : 'Network coverage, program supply, and district demand at a glance.'}</p>
          </div>
          <div className="bg-white border border-app-border rounded-xl p-3 min-w-72">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Active Teacher Profile</label>
            <div className="flex items-center gap-2">
              <select value={activeTeacher?.id ?? ''} onChange={(e) => handleTeacherChange(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand">
                <option value="">No active teacher</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
              </select>
              {changingTeacher && <Loader2 className="w-4 h-4 text-brand animate-spin shrink-0" />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Trees} label="Active Partners" value={overview?.activePartners ?? 0} sub={`${coverage}% geocoded`} />
          <StatCard icon={BookOpen} label="Programs" value={overview?.programs ?? 0} sub={`${overview?.freePrograms ?? 0} free`} />
          <StatCard icon={GraduationCap} label="Active Teacher Programs" value={opportunity?.matchedPrograms ?? (activeTeacher ? 0 : overview?.teachers ?? 0)} sub={activeTeacher ? 'within 30 miles' : 'teacher profiles'} />
          <StatCard icon={School} label="Reachable Students" value={opportunity?.reachableStudents?.toLocaleString() ?? (overview?.schools ?? 0)} sub={activeTeacher ? `${opportunity?.nearbySchools ?? 0} nearby schools` : `${overview?.districts ?? 0} districts`} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartPanel title="Programs by Subject" subtitle="Number of programs tagged to each subject area." className="xl:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subjects.slice(0, 8)} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} width={30} />
                <Tooltip formatter={(value) => [`${value} programs`, 'Programs']} labelFormatter={(label) => `Subject: ${label}`} />
                <Bar dataKey="count" name="Programs" fill="#1B6B3A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
          <ChartPanel title="Partner Mix" subtitle="Active partners grouped by organization focus.">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={types} dataKey="count" nameKey="label" outerRadius={82} innerRadius={44} paddingAngle={2}>
                  {types.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, _name, item) => [`${value} partners`, (item.payload as ChartDatum).label ?? 'Partner Type']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 gap-1.5 mt-2">
              {types.map((t, i) => (
                <div key={t.type ?? t.label} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="truncate text-gray-600">{t.label ?? t.type}</span></span>
                  <span className="font-semibold text-gray-800">{t.count}</span>
                </div>
              ))}
            </div>
          </ChartPanel>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartPanel title="Grade Coverage" subtitle="Programs available by grade level.">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={grades}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={30} />
                <Tooltip formatter={(value) => [`${value} programs`, 'Programs']} labelFormatter={(label) => `Grade: ${label}`} />
                <Bar dataKey="count" name="Programs" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
          <ListPanel title="Top Programs" empty={loading ? 'Loading programs...' : 'No engagement data yet.'}>
            {topPrograms.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{p.title}</p><p className="text-xs text-gray-500 truncate">{p.partner_name}</p></div>
                <span className="text-xs font-semibold text-brand">{p.engagement_count + p.bookmark_count}</span>
              </div>
            ))}
          </ListPanel>
          <ListPanel title="County Coverage" empty={loading ? 'Loading counties...' : 'No county coverage yet.'}>
            {counties.slice(0, 6).map((c) => (
              <div key={c.county} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.county} County</p>
                <p className="text-xs text-gray-500">{c.programs} programs · {c.partners} partners</p>
              </div>
            ))}
          </ListPanel>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Teacher Recommendations</h3>
            <Link to="/map" className="flex items-center gap-1 text-xs text-brand font-medium hover:underline"><Map className="w-3.5 h-3.5" />View map</Link>
          </div>
          {!activeTeacher ? (
            <div className="rounded-xl border-2 border-dashed border-app-border p-8 text-center">
              <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-600">Set an active teacher to personalize matches.</p>
              <Link to="/settings" className="inline-flex mt-3 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg">Open Settings</Link>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Compass className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No nearby programs found.</p></div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">{matches.map((m) => <MatchCard key={m.programId} match={m} />)}</div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-app-border p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-brand" /></div>
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p><p className="text-[11px] text-gray-400">{sub}</p></div>
    </div>
  )
}

function ChartPanel({ title, subtitle, className = '', children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return <div className={`bg-white rounded-xl border border-app-border p-4 ${className}`}><h3 className="text-sm font-semibold text-gray-900">{title}</h3>{subtitle && <p className="text-xs text-gray-500 mt-0.5 mb-3">{subtitle}</p>}{!subtitle && <div className="mb-3" />}{children}</div>
}

function ListPanel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border border-app-border p-4"><h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>{Array.isArray(children) && children.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">{empty}</p> : children}</div>
}

function MatchCard({ match }: { match: MatchResult }) {
  return (
    <div className="bg-white rounded-xl border border-app-border p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0"><p className="text-xs text-gray-500 truncate">{match.partnerName}</p><p className="text-sm font-semibold text-gray-900 leading-tight">{match.title}</p></div>
        <div className="shrink-0 text-right"><div className="text-lg font-bold text-brand leading-none">{scoreToPercent(match.score)}%</div><p className="text-[10px] text-gray-400">match</p></div>
      </div>
      {match.description && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{match.description}</p>}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {match.distanceMiles != null && <span>{formatDistance(match.distanceMiles)}</span>}
        <span>{formatCost(match.cost)}</span>
        {match.gradeLevels.length > 0 && <span>Gr. {match.gradeLevels.slice(0, 4).join(', ')}</span>}
      </div>
    </div>
  )
}
