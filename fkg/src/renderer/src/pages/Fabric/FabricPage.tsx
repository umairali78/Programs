import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, ArrowUpDown } from 'lucide-react'
import { invoke } from '../../lib/api'
import { DataTable, Column } from '../../components/common/DataTable'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency } from '../../lib/utils'

interface Fabric { id: string; name: string; type: string; color?: string; unit: string; stockQty: number; lowStockThreshold: number; costPerUnit: number }

const FABRIC_TYPES = ['Chiffon','Silk','Cotton','Lawn','Khaddar','Velvet','Net','Organza','Banarsi','Lace','Other']

export function FabricPage() {
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Fabric | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showAdj, setShowAdj] = useState<Fabric | null>(null)
  const [form, setForm] = useState({ name: '', type: 'Cotton', color: '', unit: 'meter', stockQty: '0', lowStockThreshold: '5', costPerUnit: '' })
  const [adjForm, setAdjForm] = useState({ type: 'PURCHASE', qty: '', note: '' })

  useEffect(() => { load() }, [])
  const load = async () => { setLoading(true); try { setFabrics(await invoke<Fabric[]>('fabric:listFabrics', {})) } finally { setLoading(false) } }

  const filtered = fabrics.filter((f) => { const s = search.toLowerCase(); return !s || f.name.toLowerCase().includes(s) || (f.color && f.color.toLowerCase().includes(s)) })

  const handleSave = async () => {
    try {
      const payload = { name: form.name, type: form.type, color: form.color || null, unit: form.unit, stockQty: parseFloat(form.stockQty) || 0, lowStockThreshold: parseFloat(form.lowStockThreshold) || 5, costPerUnit: parseFloat(form.costPerUnit) || 0 }
      if (editItem) { await invoke('fabric:updateFabric', { id: editItem.id, updates: payload }) }
      else { await invoke('fabric:createFabric', payload) }
      setShowForm(false); setEditItem(null)
      setForm({ name: '', type: 'Cotton', color: '', unit: 'meter', stockQty: '0', lowStockThreshold: '5', costPerUnit: '' })
      load()
    } catch (e: any) { alert(e.message) }
  }

  const handleEdit = (f: Fabric) => {
    setEditItem(f)
    setForm({ name: f.name, type: f.type, color: f.color ?? '', unit: f.unit, stockQty: String(f.stockQty), lowStockThreshold: String(f.lowStockThreshold), costPerUnit: String(f.costPerUnit) })
    setShowForm(true)
  }

  const handleAdj = async () => {
    if (!showAdj) return
    await invoke('fabric:recordMovement', { fabricId: showAdj.id, type: adjForm.type, qtyChange: parseFloat(adjForm.qty) || 0, note: adjForm.note })
    setShowAdj(null); setAdjForm({ type: 'PURCHASE', qty: '', note: '' }); load()
  }

  const columns: Column<Fabric>[] = [
    { key: 'name', header: 'Fabric', render: (f) => <div><div className="font-medium">{f.name}</div><div className="text-xs text-dark/40">{f.type} {f.color ? `· ${f.color}` : ''}</div></div> },
    { key: 'stock', header: 'Stock', render: (f) => <span className={f.stockQty <= f.lowStockThreshold ? 'text-red-600 font-semibold' : ''}>{f.stockQty} {f.unit}</span> },
    { key: 'costPerUnit', header: 'Cost/Unit', render: (f) => formatCurrency(f.costPerUnit) },
    { key: 'actions', header: '', render: (f) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setShowAdj(f)} className="p-1.5 hover:bg-surface rounded" title="Adjust Stock"><ArrowUpDown size={14} /></button>
        <button onClick={() => handleEdit(f)} className="p-1.5 hover:bg-surface rounded"><Edit size={14} /></button>
        <button onClick={() => setDeleteId(f.id)} className="p-1.5 hover:bg-surface rounded text-red-500"><Trash2 size={14} /></button>
      </div>
    )}
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search fabrics..." className="w-full pl-9 pr-3 py-2 border border-app-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand/90"><Plus size={16} /> Add Fabric</button>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} keyExtractor={(f) => f.id} />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowForm(false); setEditItem(null) }} />
          <div className="relative bg-white rounded-card shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-dark mb-4">{editItem ? 'Edit Fabric' : 'Add Fabric'}</h3>
            <div className="space-y-3">
              <div><label className="text-sm text-dark/60 mb-1 block">Name *</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm text-dark/60 mb-1 block">Type</label><select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm">{FABRIC_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
                <div><label className="text-sm text-dark/60 mb-1 block">Unit</label><select value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm"><option>meter</option><option>yard</option></select></div>
              </div>
              <div><label className="text-sm text-dark/60 mb-1 block">Color</label><input value={form.color} onChange={(e) => setForm({...form, color: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-sm text-dark/60 mb-1 block">Cost/Unit</label><input type="number" value={form.costPerUnit} onChange={(e) => setForm({...form, costPerUnit: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-sm text-dark/60 mb-1 block">Stock</label><input type="number" value={form.stockQty} onChange={(e) => setForm({...form, stockQty: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-sm text-dark/60 mb-1 block">Low Stock</label><input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({...form, lowStockThreshold: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setEditItem(null) }} className="flex-1 border border-app-border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      {showAdj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdj(null)} />
          <div className="relative bg-white rounded-card shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-dark mb-1">Adjust Stock</h3>
            <p className="text-sm text-dark/50 mb-4">{showAdj.name}</p>
            <div className="space-y-3">
              <div><label className="text-sm text-dark/60 mb-1 block">Type</label><select value={adjForm.type} onChange={(e) => setAdjForm({...adjForm, type: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm"><option value="PURCHASE">Purchase</option><option value="ADJUSTMENT">Adjustment</option><option value="LOSS">Loss</option></select></div>
              <div><label className="text-sm text-dark/60 mb-1 block">Quantity ({showAdj.unit})</label><input type="number" value={adjForm.qty} onChange={(e) => setAdjForm({...adjForm, qty: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm text-dark/60 mb-1 block">Note</label><input value={adjForm.note} onChange={(e) => setAdjForm({...adjForm, note: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdj(null)} className="flex-1 border border-app-border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleAdj} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Fabric" description="Fabric will be archived." onConfirm={async () => { await invoke('fabric:deleteFabric', { id: deleteId }); setDeleteId(null); load() }} onCancel={() => setDeleteId(null)} confirmLabel="Delete" danger />
    </div>
  )
}
