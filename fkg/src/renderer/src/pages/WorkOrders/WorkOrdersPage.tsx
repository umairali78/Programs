import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, AlertTriangle } from 'lucide-react'
import { invoke } from '../../lib/api'
import { DataTable, Column } from '../../components/common/DataTable'
import { StatusBadge } from '../../components/common/StatusBadge'
import { formatCurrency, formatDate } from '../../lib/utils'
import { WorkOrderForm } from './WorkOrderForm'

interface WorkOrder {
  id: string; orderNo: string; customerId: string; category: string; orderType: string
  status: string; priority: string; dueDate?: string; totalAmount: number; paidAmount: number
  createdAt: string | Date
}

const STATUSES = ['New', 'In Progress', 'Quality Check', 'Ready for Delivery', 'Delivered', 'Cancelled', 'On Hold']

export function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { setOrders(await invoke<WorkOrder[]>('workorder:listWorkOrders', {})) }
    finally { setLoading(false) }
  }

  const filtered = orders.filter((o) => {
    const matchStatus = !filterStatus || o.status === filterStatus
    const s = search.toLowerCase()
    const matchSearch = !s || o.orderNo.toLowerCase().includes(s)
    return matchStatus && matchSearch
  })

  const today = new Date().toISOString().split('T')[0]

  const columns: Column<WorkOrder>[] = [
    { key: 'orderNo', header: 'Order No', render: (o) => <span className="font-mono font-medium">{o.orderNo}</span> },
    { key: 'category', header: 'Category / Type', render: (o) => <div><div className="font-medium">{o.category}</div><div className="text-xs text-dark/40">{o.orderType}</div></div> },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'priority', header: 'Priority', render: (o) => <StatusBadge status={o.priority} /> },
    { key: 'dueDate', header: 'Due Date', render: (o) => (
      <span className={o.dueDate && o.dueDate < today && !['Delivered','Cancelled'].includes(o.status) ? 'text-red-600 font-semibold' : ''}>
        {formatDate(o.dueDate)}
        {o.dueDate && o.dueDate < today && !['Delivered','Cancelled'].includes(o.status) && <AlertTriangle size={12} className="inline ml-1" />}
      </span>
    )},
    { key: 'amount', header: 'Amount', render: (o) => (
      <div>
        <div>{formatCurrency(o.totalAmount)}</div>
        <div className="text-xs text-dark/40">Paid: {formatCurrency(o.paidAmount)}</div>
      </div>
    )}
  ]

  // Kanban view
  const kanban = STATUSES.map((s) => ({ status: s, orders: filtered.filter((o) => o.status === s) }))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order no..." className="w-full pl-9 pr-3 py-2 border border-app-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-app-border rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex border border-app-border rounded-lg overflow-hidden">
          <button onClick={() => setView('table')} className={`px-3 py-2 text-sm ${view === 'table' ? 'bg-brand text-white' : 'hover:bg-surface'}`}>Table</button>
          <button onClick={() => setView('kanban')} className={`px-3 py-2 text-sm ${view === 'kanban' ? 'bg-brand text-white' : 'hover:bg-surface'}`}>Kanban</button>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand/90">
          <Plus size={16} /> New Order
        </button>
      </div>

      {view === 'table' ? (
        <DataTable columns={columns} data={filtered} loading={loading} onRowClick={(o) => navigate(`/work-orders/${o.id}`)} keyExtractor={(o) => o.id} emptyMessage="No work orders found" />
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4 min-w-max">
            {kanban.map(({ status, orders: statusOrders }) => (
              <div key={status} className="w-64 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge status={status} />
                  <span className="text-xs text-dark/40 font-medium">{statusOrders.length}</span>
                </div>
                <div className="space-y-2">
                  {statusOrders.map((o) => (
                    <div key={o.id} onClick={() => navigate(`/work-orders/${o.id}`)} className="bg-white rounded-lg border border-app-border p-3 cursor-pointer hover:shadow-sm">
                      <div className="font-mono text-sm font-medium">{o.orderNo}</div>
                      <div className="text-xs text-dark/50 mt-0.5">{o.category}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs">{formatCurrency(o.totalAmount)}</span>
                        {o.dueDate && <span className={`text-xs ${o.dueDate < today && !['Delivered','Cancelled'].includes(o.status) ? 'text-red-600' : 'text-dark/40'}`}>{formatDate(o.dueDate)}</span>}
                      </div>
                    </div>
                  ))}
                  {statusOrders.length === 0 && <div className="text-xs text-dark/30 text-center py-4">No orders</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && <WorkOrderForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
