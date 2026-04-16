import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Star, Edit, Trash2, Phone } from 'lucide-react'
import { invoke } from '../../lib/api'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { getInitials } from '../../lib/utils'

interface Vendor { id: string; name: string; phone?: string; specialty_tags_json?: string; ratingAvg?: number; totalPaid: number; isActive: boolean }

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Vendor | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', whatsapp: '', address: '', cnic: '', notes: '' })
  const navigate = useNavigate()

  useEffect(() => { load() }, [])
  const load = async () => {
    setLoading(true)
    try { setVendors(await invoke<Vendor[]>('vendor:listVendors', {})) }
    finally { setLoading(false) }
  }

  const filtered = vendors.filter((v) => {
    const s = search.toLowerCase()
    return !s || v.name.toLowerCase().includes(s) || (v.phone && v.phone.includes(s))
  })

  const handleSave = async () => {
    try {
      const payload = { name: form.name, phone: form.phone || null, whatsapp: form.whatsapp || null, address: form.address || null, cnic: form.cnic || null, notes: form.notes || null, isActive: true }
      if (editItem) {
        await invoke('vendor:updateVendor', { id: editItem.id, updates: payload })
      } else {
        await invoke('vendor:createVendor', payload)
      }
      setShowForm(false); setEditItem(null)
      setForm({ name: '', phone: '', whatsapp: '', address: '', cnic: '', notes: '' })
      load()
    } catch (e: any) { alert(e.message) }
  }

  const handleEdit = (v: Vendor) => {
    setEditItem(v)
    setForm({ name: v.name, phone: v.phone ?? '', whatsapp: '', address: '', cnic: '', notes: '' })
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await invoke('vendor:deleteVendor', { id: deleteId })
    setDeleteId(null); load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors..." className="w-full pl-9 pr-3 py-2 border border-app-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand/90">
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && <p className="text-dark/40 col-span-3 text-center py-12">No vendors found</p>}
          {filtered.map((v) => (
            <div key={v.id} onClick={() => navigate(`/vendors/${v.id}`)} className="bg-white rounded-card border border-app-border p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/10 text-accent rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                  {getInitials(v.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-dark truncate">{v.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < Math.round(v.ratingAvg ?? 0) ? 'text-gold fill-gold' : 'text-dark/20'} />
                    ))}
                    <span className="text-xs text-dark/40 ml-1">{v.ratingAvg?.toFixed(1) ?? '—'}</span>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleEdit(v)} className="p-1.5 hover:bg-surface rounded"><Edit size={13} /></button>
                  <button onClick={() => setDeleteId(v.id)} className="p-1.5 hover:bg-surface rounded text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
              {v.phone && <div className="flex items-center gap-2 text-xs text-dark/60 mt-3"><Phone size={12} />{v.phone}</div>}
              <div className={`text-xs mt-2 font-medium ${v.isActive ? 'text-green-600' : 'text-red-500'}`}>{v.isActive ? 'Active' : 'Inactive'}</div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowForm(false); setEditItem(null) }} />
          <div className="relative bg-white rounded-card shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-dark mb-4">{editItem ? 'Edit Vendor' : 'Add Vendor'}</h3>
            <div className="space-y-3">
              {[['name','Name *','text'],['phone','Phone','tel'],['whatsapp','WhatsApp','tel'],['cnic','CNIC','text'],['address','Address','text']].map(([key, label, type]) => (
                <div key={key}>
                  <label className="text-sm text-dark/60 mb-1 block">{label}</label>
                  <input type={type} value={(form as any)[key]} onChange={(e) => setForm({...form, [key]: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
              ))}
              <div>
                <label className="text-sm text-dark/60 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm resize-none" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setEditItem(null) }} className="flex-1 border border-app-border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Vendor" description="Vendor will be archived." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} confirmLabel="Delete" danger />
    </div>
  )
}
