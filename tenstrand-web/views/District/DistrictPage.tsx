'use client'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart2, GraduationCap, School, Search, Users } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'

interface DistrictRow { id: string; name: string; county: string | null; enrollment: number; schools: number; teachers: number; title1Schools: number }
interface DistrictAnalytics { districts: DistrictRow[]; subjects: { subject: string; teachers: number }[]; teacherCounties: { county: string; teachers: number }[]; schoolCounties: { county: string; schools: number; enrollment: number }[] }

export function DistrictPage() {
  const [data, setData] = useState<DistrictAnalytics | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    invoke<DistrictAnalytics>('insights:districtAnalytics')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const districts = data?.districts ?? []
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return districts
    return districts.filter((d) => [d.name, d.county].some((v) => v?.toLowerCase().includes(q)))
  }, [districts, query])

  const totals = useMemo(() => ({
    districts: districts.length,
    schools: districts.reduce((sum, d) => sum + d.schools, 0),
    teachers: districts.reduce((sum, d) => sum + d.teachers, 0),
    enrollment: districts.reduce((sum, d) => sum + d.enrollment, 0),
  }), [districts])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="District Dashboard" />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MiniStat icon={BarChart2} label="Districts" value={totals.districts} />
          <MiniStat icon={School} label="Schools" value={totals.schools} />
          <MiniStat icon={GraduationCap} label="Teachers" value={totals.teachers} />
          <MiniStat icon={Users} label="Enrollment" value={totals.enrollment.toLocaleString()} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartPanel title="Teacher Demand by County">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={(data?.teacherCounties ?? []).slice(0, 10)} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="county" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} width={30} />
                <Tooltip />
                <Bar dataKey="teachers" fill="#1B6B3A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
          <ChartPanel title="Teacher Subjects">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={(data?.subjects ?? []).slice(0, 8)} layout="vertical" margin={{ left: 80, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="subject" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="teachers" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        <div className="bg-white border border-app-border rounded-xl p-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search districts or counties..." className="bg-transparent outline-none text-sm flex-1 min-w-0" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-app-border overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_100px_100px_110px] gap-3 px-4 py-2 border-b border-app-border text-xs font-semibold text-gray-500">
            <span>District</span><span>County</span><span>Schools</span><span>Teachers</span><span>Enrollment</span>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No districts match that search.</p>
          ) : filtered.map((d) => (
            <div key={d.id} className="grid grid-cols-[1fr_120px_100px_100px_110px] gap-3 px-4 py-3 border-b border-gray-100 last:border-0 text-sm items-center">
              <div className="min-w-0"><p className="font-medium text-gray-900 truncate">{d.name}</p>{d.title1Schools > 0 && <p className="text-[11px] text-gray-400">{d.title1Schools} Title I schools</p>}</div>
              <span className="text-gray-500 truncate">{d.county ?? 'Unknown'}</span>
              <span className="text-gray-700">{d.schools}</span>
              <span className="text-gray-700">{d.teachers}</span>
              <span className="text-gray-700">{d.enrollment.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return <div className="bg-white border border-app-border rounded-xl p-4 flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center"><Icon className="w-4 h-4 text-brand" /></div><div><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div></div>
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border border-app-border p-4"><h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>{children}</div>
}
