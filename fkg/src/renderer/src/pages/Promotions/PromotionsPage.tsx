import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import { invoke } from '../../lib/api'
import { DataTable, Column } from '../../components/common/DataTable'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatDate, formatCurrency } from '../../lib/utils'

interface Coupon { id: string; code: string; type: string; value: number; minOrderValue?: number; maxUses?: number; usedCount: number; validFrom?: string; validTo?: string; isActive: boolean }

export function PromotionsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Coupon | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', type: 'PERCENT', value: '', minOrderValue: '', maxUses: '', validFrom: '', validTo: '' })

  useEffect(() => { load() }, [])
  const load = async () => { setLoading(true); try { setCoupons(await invoke<Coupon[]>('promotion:listCoupons', {})) } finally { setLoading(false) } }

  const handleSave = async () => {
    try {
      const payload = { code: form.code, type: form.type, value: parseFloat(form.value) || 0, minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : null, maxUses: form.maxUses ? parseInt(form.maxUses) : null, validFrom: form.validFrom || null, validTo: form.validTo || null, isActive: true }
      if (editItem) { await invoke('promotion:updateCoupon', { id: editItem.id, updates: payload }) }
      else { await invoke('promotion:createCoupon', payload) }
      setShowForm(false); setEditItem(null)
      setForm({ code: '', type: 'PERCENT', value: '', minOrderValue: '', maxUses: '', validFrom: '', validTo: '' })
      load()
    } catch (e: any) { alert(e.message) }
  }

  const handleEdit = (c: Coupon) => {
    setEditItem(c)
    setForm({ code: c.code, type: c.type, value: String(c.value), minOrderValue: c.minOrderValue ? String(c.minOrderValue) : '', maxUses: c.maxUses ? String(c.maxUses) : '', validFrom: c.validFrom ?? '', validTo: c.validTo ?? '' })
    setShowForm(true)
  }

  const columns: Column<Coupon>[] = [
    { key: 'code', header: 'Code', render: (c) => <span className="font-mono font-semibold bg-brand/10 text-brand px-2 py-0.5 rounded">{c.code}</span> },
    { key: 'type', header: 'Discount', render: (c) => c.type === 'PERCENT' ? `${c.value}%` : formatCurrency(c.value) },
    { key: 'usage', header: 'Usage', render: (c) => `${c.usedCount} / ${c.maxUses ?? '∞'}` },
    { key: 'validity', header: 'Valid', render: (c) => c.validFrom ? `${formatDate(c.validFrom)} — ${formatDate(c.validTo)}` : 'Always' },
    { key: 'isActive', header: 'Status', render: (c) => <span className={`text-xs font-medium ${c.isActive ? 'text-green-600' : 'text-red-500'}`}>{c.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', header: '', render: (c) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => handleEdit(c)} className="p-1.5 hover:bg-surface rounded"><Edit size={14} /></button>
        <button onClick={() => setDeleteId(c.id)} className="p-1.5 hover:bg-surface rounded text-red-500"><Trash2 size={14} /></button>
      </div>
    )}
  ]

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand/90"><Plus size={16} /> Add Coupon</button>
      </div>

      <DataTable columns={columns} data={coupons} loading={loading} keyExtractor={(c) => c.id} emptyMessage="No coupons yet" />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowForm(false); setEditItem(null) }} />
          <div className="relative bg-white rounded-card shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-dark mb-4">{editItem ? 'Edit Coupon' : 'Add Coupon'}</h3>
            <div className="space-y-3">
              <div><label className="text-sm text-dark/60 mb-1 block">Code *</label><input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm font-mono" placeholder="SUMMER20" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm text-dark/60 mb-1 block">Type</label><select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm"><option value="PERCENT">Percentage</option><option value="FIXED">Fixed Amount</option></select></div>
                <div><label className="text-sm text-dark/60 mb-1 block">Value</label><input type="number" value={form.value} onChange={(e) => setForm({...form, value: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm text-dark/60 mb-1 block">Min Order</label><input type="number" value={form.minOrderValue} onChange={(e) => setForm({...form, minOrderValue: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" placeholder="Optional" /></div>
                <div><label className="text-sm text-dark/60 mb-1 block">Max Uses</label><input type="number" value={form.maxUses} onChange={(e) => setForm({...form, maxUses: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" placeholder="Unlimited" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm text-dark/60 mb-1 block">Valid From</label><input type="date" value={form.validFrom} onChange={(e) => setForm({...form, validFrom: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-sm text-dark/60 mb-1 block">Valid To</label><input type="date" value={form.validTo} onChange={(e) => setForm({...form, validTo: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setEditItem(null) }} className="flex-1 border border-app-border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Coupon" description="This coupon will be permanently deleted." onConfirm={async () => { await invoke('promotion:deleteCoupon', { id: deleteId }); setDeleteId(null); load() }} onCancel={() => setDeleteId(null)} confirmLabel="Delete" danger />
    </div>
  )
}
