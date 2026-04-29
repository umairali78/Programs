'use client'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Edit2, Globe, Mail, MapPin, Phone, Plus, Search, Tag, Trash2, Trees } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { PartnerForm } from '@/components/partners/PartnerForm'
import { getPartnerTypeColor, getPartnerTypeName } from '@/lib/utils'

interface Partner { id: string; name: string; type: string; description: string | null; address: string | null; city: string | null; phone: string | null; topics: string | null; lat: number | null; lng: number | null; county: string | null; contactEmail: string | null; website: string | null; status: string; profileScore: number | null; geocodingStatus: string | null }
interface Program { id: string; partnerId: string; title: string }

export function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPartner, setEditPartner] = useState<Partner | null>(null)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')

  const load = () => {
    setLoading(true)
    Promise.all([invoke<Partner[]>('partner:list'), invoke<Program[]>('program:list')])
      .then(([parts, progs]) => { setPartners(parts); setPrograms(progs) })
      .catch(() => toast.error('Failed to load partners'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const programCounts = useMemo(() => programs.reduce<Record<string, number>>((acc, p) => {
    acc[p.partnerId] = (acc[p.partnerId] || 0) + 1
    return acc
  }, {}), [programs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return partners.filter((p) => {
      if (type !== 'all' && p.type !== type) return false
      if (status !== 'all' && p.status !== status) return false
      if (!q) return true
      return [p.name, p.description, p.county, p.contactEmail].some((v) => v?.toLowerCase().includes(q))
    })
  }, [partners, query, type, status])

  const types = useMemo(() => Array.from(new Set(partners.map((p) => p.type))).sort(), [partners])
  const activePartners = partners.filter((p) => p.status === 'active').length
  const mappedPartners = partners.filter((p) => p.lat != null && p.lng != null).length

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete partner "${name}"?`)) return
    try { await invoke('partner:delete', { id }); toast.success('Partner deleted'); load() }
    catch { toast.error('Failed to delete partner') }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Partners">
        <button onClick={() => { setEditPartner(null); setShowForm(true) }} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors">
          <Plus className="w-3.5 h-3.5" />Add Partner
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <MiniStat label="Partners" value={partners.length} />
          <MiniStat label="Active" value={activePartners} />
          <MiniStat label="Mapped" value={mappedPartners} />
        </div>

        <div className="bg-white border border-app-border rounded-xl p-3 flex flex-col lg:flex-row gap-2">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search partners, counties, contacts..." className="bg-transparent outline-none text-sm flex-1 min-w-0" />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="all">All types</option>
            {types.map((t) => <option key={t} value={t}>{getPartnerTypeName(t)}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Trees className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm font-medium">No partners match those filters</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-app-border p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: getPartnerTypeColor(p.type) + '20' }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getPartnerTypeColor(p.type) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{getPartnerTypeName(p.type)}</span>
                        {p.county && <span className="text-xs text-gray-500">{p.county} County</span>}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-light text-brand font-medium">{programCounts[p.id] || 0} programs</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditPartner(p); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  {p.description && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{p.description}</p>}
                  {/* Topics */}
                  {p.topics && (() => { try { const t = JSON.parse(p.topics); return t.length > 0 ? <div className="flex flex-wrap gap-1 mt-1.5">{t.slice(0, 5).map((topic: string) => <span key={topic} className="text-[10px] px-1.5 py-0.5 bg-brand-light text-brand rounded-full">{topic}</span>)}</div> : null } catch { return null } })()}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                    {(p.address || p.city || p.county) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[p.city, p.county ? `${p.county} County` : null].filter(Boolean).join(', ') || (p.geocodingStatus === 'success' ? 'Geocoded' : 'Address set')}
                      </span>
                    )}
                    {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                    {p.contactEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.contactEmail}</span>}
                    {p.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{p.website.replace(/https?:\/\//, '')}</span>}
                    <Link to="/programs" className="flex items-center gap-1 text-brand"><BookOpen className="w-3 h-3" />View programs</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <PartnerForm partner={editPartner} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="bg-white border border-app-border rounded-xl p-4"><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div>
}
