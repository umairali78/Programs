import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { invoke } from '../../lib/api'
import { DataTable, Column } from '../../components/common/DataTable'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatDate } from '../../lib/utils'

interface Staff { id: string; name: string; phone?: string; email?: string; role: string; commissionType: string; commissionValue?: number; joiningDate?: string; isActive: boolean }

const ATTENDANCE_STATUSES = ['PRESENT','ABSENT','LEAVE','HALF_DAY']

export function StaffPage() {
  const [members, setMembers] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Staff | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showAttendance, setShowAttendance] = useState(false)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'staff', commissionType: 'NONE', commissionValue: '', joiningDate: '' })

  useEffect(() => { load() }, [])
  const load = async () => { setLoading(true); try { setMembers(await invoke<Staff[]>('staff:listStaff', {})) } finally { setLoading(false) } }

  const handleSave = async () => {
    try {
      const payload = { name: form.name, phone: form.phone || null, email: form.email || null, role: form.role, commissionType: form.commissionType, commissionValue: form.commissionValue ? parseFloat(form.commissionValue) : 0, joiningDate: form.joiningDate || null, isActive: true }
      if (editItem) { await invoke('staff:updateStaff', { id: editItem.id, updates: payload }) }
      else { await invoke('staff:createStaff', payload) }
      setShowForm(false); setEditItem(null)
      setForm({ name: '', phone: '', email: '', role: 'staff', commissionType: 'NONE', commissionValue: '', joiningDate: '' })
      load()
    } catch (e: any) { alert(e.message) }
  }

  const handleEdit = (s: Staff) => {
    setEditItem(s)
    setForm({ name: s.name, phone: s.phone ?? '', email: s.email ?? '', role: s.role, commissionType: s.commissionType, commissionValue: s.commissionValue ? String(s.commissionValue) : '', joiningDate: s.joiningDate ?? '' })
    setShowForm(true)
  }

  const saveAttendance = async () => {
    for (const [staffId, status] of Object.entries(attendance)) {
      await invoke('staff:markAttendance', { staffId, date: attendanceDate, status })
    }
    setShowAttendance(false)
    alert('Attendance saved!')
  }

  const columns: Column<Staff>[] = [
    { key: 'name', header: 'Name', render: (s) => <div><div className="font-medium">{s.name}</div><div className="text-xs text-dark/40">{s.role}</div></div> },
    { key: 'phone', header: 'Contact', render: (s) => <div><div className="text-sm">{s.phone ?? '—'}</div><div className="text-xs text-dark/40">{s.email ?? ''}</div></div> },
    { key: 'commission', header: 'Commission', render: (s) => s.commissionType === 'NONE' ? '—' : `${s.commissionType === 'PERCENT' ? `${s.commissionValue}%` : `PKR ${s.commissionValue}`}` },
    { key: 'joiningDate', header: 'Joined', render: (s) => formatDate(s.joiningDate) },
    { key: 'isActive', header: 'Status', render: (s) => <span className={`text-xs font-medium ${s.isActive ? 'text-green-600' : 'text-red-500'}`}>{s.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', header: '', render: (s) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-surface rounded"><Edit size={14} /></button>
        <button onClick={() => setDeleteId(s.id)} className="p-1.5 hover:bg-surface rounded text-red-500"><Trash2 size={14} /></button>
      </div>
    )}
  ]

  return (
    <div className="space-y-5">
      <div className="flex justify-end gap-3">
        <button onClick={() => setShowAttendance(true)} className="flex items-center gap-2 border border-app-border px-4 py-2 rounded-lg text-sm hover:bg-surface"><Calendar size={16} /> Mark Attendance</button>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand/90"><Plus size={16} /> Add Staff</button>
      </div>

      <DataTable columns={columns} data={members} loading={loading} keyExtractor={(s) => s.id} emptyMessage="No staff members" />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowForm(false); setEditItem(null) }} />
          <div className="relative bg-white rounded-card shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-dark mb-4">{editItem ? 'Edit Staff' : 'Add Staff'}</h3>
            <div className="space-y-3">
              <div><label className="text-sm text-dark/60 mb-1 block">Name *</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm text-dark/60 mb-1 block">Phone</label><input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-sm text-dark/60 mb-1 block">Role</label><select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm"><option value="admin">Admin</option><option value="manager">Manager</option><option value="staff">Staff</option><option value="cashier">Cashier</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm text-dark/60 mb-1 block">Commission Type</label><select value={form.commissionType} onChange={(e) => setForm({...form, commissionType: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm"><option value="NONE">None</option><option value="PERCENT">%</option><option value="FIXED">Fixed</option></select></div>
                {form.commissionType !== 'NONE' && <div><label className="text-sm text-dark/60 mb-1 block">Value</label><input type="number" value={form.commissionValue} onChange={(e) => setForm({...form, commissionValue: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>}
              </div>
              <div><label className="text-sm text-dark/60 mb-1 block">Joining Date</label><input type="date" value={form.joiningDate} onChange={(e) => setForm({...form, joiningDate: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setEditItem(null) }} className="flex-1 border border-app-border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      {showAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAttendance(false)} />
          <div className="relative bg-white rounded-card shadow-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="font-semibold text-dark mb-4">Mark Attendance</h3>
            <div className="mb-4"><label className="text-sm text-dark/60 mb-1 block">Date</label><input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 border border-app-border rounded-lg">
                  <span className="text-sm font-medium">{m.name}</span>
                  <select value={attendance[m.id] ?? 'PRESENT'} onChange={(e) => setAttendance({...attendance, [m.id]: e.target.value})} className="border border-app-border rounded px-2 py-1 text-xs">
                    {ATTENDANCE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAttendance(false)} className="flex-1 border border-app-border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={saveAttendance} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Staff Member" description="Staff member will be archived." onConfirm={async () => { await invoke('staff:deleteStaff', { id: deleteId }); setDeleteId(null); load() }} onCancel={() => setDeleteId(null)} confirmLabel="Delete" danger />
    </div>
  )
}
