import { useEffect, useState } from 'react'
import { TrendingUp, Receipt, Plus } from 'lucide-react'
import { invoke } from '../../lib/api'
import { DataTable, Column } from '../../components/common/DataTable'
import { StatusBadge } from '../../components/common/StatusBadge'
import { formatCurrency, formatDateTime } from '../../lib/utils'

interface Payment { id: string; workOrderId: string; amount: number; paymentType: string; method: string; referenceNo?: string; note?: string; createdAt: string | Date }
interface Expense { id: string; category: string; description: string; amount: number; method: string; expenseDate: string }

export function PaymentsPage() {
  const [tab, setTab] = useState<'payments' | 'expenses' | 'vendor'>('payments')
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vendorPayments, setVendorPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [showExpForm, setShowExpForm] = useState(false)
  const [expForm, setExpForm] = useState({ category: 'Rent', description: '', amount: '', method: 'Cash', expenseDate: new Date().toISOString().split('T')[0] })

  const EXPENSE_CATEGORIES = ['Rent','Utilities','Salaries','Raw Materials','Marketing','Maintenance','Transport','Equipment','Miscellaneous']

  useEffect(() => { loadAll() }, [])
  const loadAll = async () => {
    setLoading(true)
    try {
      const [p, e, vp, rev] = await Promise.all([
        invoke<Payment[]>('payment:getRecentPayments', { limit: 50 }),
        invoke<Expense[]>('payment:listExpenses', {}),
        invoke<any[]>('payment:getVendorPayments', {}),
        invoke<number>('payment:getTotalRevenue', {})
      ])
      setPayments(p); setExpenses(e); setVendorPayments(vp); setTotalRevenue(rev)
    } finally { setLoading(false) }
  }

  const handleSaveExpense = async () => {
    try {
      await invoke('payment:createExpense', { ...expForm, amount: parseFloat(expForm.amount) || 0 })
      setShowExpForm(false)
      setExpForm({ category: 'Rent', description: '', amount: '', method: 'Cash', expenseDate: new Date().toISOString().split('T')[0] })
      loadAll()
    } catch (e: any) { alert(e.message) }
  }

  const paymentCols: Column<Payment>[] = [
    { key: 'createdAt', header: 'Date', render: (p) => <span className="text-xs">{formatDateTime(p.createdAt)}</span> },
    { key: 'workOrderId', header: 'Order', render: (p) => <span className="font-mono text-xs">{p.workOrderId.slice(0, 8)}…</span> },
    { key: 'paymentType', header: 'Type', render: (p) => <StatusBadge status={p.paymentType} /> },
    { key: 'method', header: 'Method', render: (p) => <span className="text-sm">{p.method}</span> },
    { key: 'amount', header: 'Amount', render: (p) => <span className={`font-semibold ${p.paymentType === 'REFUND' ? 'text-red-600' : 'text-green-600'}`}>{p.paymentType === 'REFUND' ? '-' : '+'}{formatCurrency(p.amount)}</span> }
  ]

  const expenseCols: Column<Expense>[] = [
    { key: 'expenseDate', header: 'Date', render: (e) => e.expenseDate },
    { key: 'category', header: 'Category', render: (e) => <span className="text-sm font-medium">{e.category}</span> },
    { key: 'description', header: 'Description', render: (e) => e.description },
    { key: 'method', header: 'Method', render: (e) => e.method },
    { key: 'amount', header: 'Amount', render: (e) => <span className="font-semibold text-dark">{formatCurrency(e.amount)}</span> }
  ]

  const vpCols: Column<any>[] = [
    { key: 'vendorId', header: 'Vendor', render: (vp) => <span className="text-xs font-mono">{vp.vendorId?.slice(0, 8)}…</span> },
    { key: 'serviceType', header: 'Service', render: (vp) => vp.serviceType },
    { key: 'amount', header: 'Amount', render: (vp) => formatCurrency(vp.amount) },
    { key: 'status', header: 'Status', render: (vp) => <StatusBadge status={vp.status} /> },
    { key: 'actions', header: '', render: (vp) => vp.status === 'Pending' ? (
      <button onClick={() => invoke('payment:markVendorPaymentPaid', { id: vp.id }).then(loadAll)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200">Mark Paid</button>
    ) : null }
  ]

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-card border border-app-border p-4 flex items-center gap-3">
          <TrendingUp size={20} className="text-green-600" />
          <div><div className="text-xs text-dark/50">Total Revenue</div><div className="font-bold text-dark">{formatCurrency(totalRevenue)}</div></div>
        </div>
        <div className="bg-white rounded-card border border-app-border p-4 flex items-center gap-3">
          <Receipt size={20} className="text-brand" />
          <div><div className="text-xs text-dark/50">Total Expenses</div><div className="font-bold text-dark">{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}</div></div>
        </div>
        <div className="bg-white rounded-card border border-app-border p-4 flex items-center gap-3">
          <TrendingUp size={20} className="text-blue-600" />
          <div><div className="text-xs text-dark/50">Vendor Payments</div><div className="font-bold text-dark">{formatCurrency(vendorPayments.filter(v => v.status === 'Paid').reduce((s, v) => s + v.amount, 0))}</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-app-border">
        {(['payments','expenses','vendor'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 transition-colors ${tab === t ? 'border-brand text-brand' : 'border-transparent text-dark/50 hover:text-dark'}`}>{t === 'vendor' ? 'Vendor Payments' : t}</button>
        ))}
        {tab === 'expenses' && (
          <button onClick={() => setShowExpForm(true)} className="ml-auto mb-1 flex items-center gap-1 text-sm bg-brand text-white px-3 py-1.5 rounded-lg hover:bg-brand/90"><Plus size={14} /> Add Expense</button>
        )}
      </div>

      {tab === 'payments' && <DataTable columns={paymentCols} data={payments} loading={loading} keyExtractor={(p) => p.id} emptyMessage="No payments" />}
      {tab === 'expenses' && <DataTable columns={expenseCols} data={expenses} loading={loading} keyExtractor={(e) => e.id} emptyMessage="No expenses" />}
      {tab === 'vendor' && <DataTable columns={vpCols} data={vendorPayments} loading={loading} keyExtractor={(v) => v.id} emptyMessage="No vendor payments" />}

      {showExpForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowExpForm(false)} />
          <div className="relative bg-white rounded-card shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-dark mb-4">Add Expense</h3>
            <div className="space-y-3">
              <div><label className="text-sm text-dark/60 mb-1 block">Category</label><select value={expForm.category} onChange={(e) => setExpForm({...expForm, category: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm">{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label className="text-sm text-dark/60 mb-1 block">Description</label><input value={expForm.description} onChange={(e) => setExpForm({...expForm, description: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm text-dark/60 mb-1 block">Amount</label><input type="number" value={expForm.amount} onChange={(e) => setExpForm({...expForm, amount: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm text-dark/60 mb-1 block">Method</label><select value={expForm.method} onChange={(e) => setExpForm({...expForm, method: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm"><option>Cash</option><option>Bank Transfer</option><option>Card</option></select></div>
              <div><label className="text-sm text-dark/60 mb-1 block">Date</label><input type="date" value={expForm.expenseDate} onChange={(e) => setExpForm({...expForm, expenseDate: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowExpForm(false)} className="flex-1 border border-app-border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleSaveExpense} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
