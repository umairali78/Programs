import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Circle, AlertCircle, Plus, CreditCard, FileText } from 'lucide-react'
import { invoke } from '../../lib/api'
import { StatusBadge } from '../../components/common/StatusBadge'
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils'

const STATUSES = ['New', 'In Progress', 'Quality Check', 'Ready for Delivery', 'Delivered', 'Cancelled']
const STAGE_STATUSES = ['Pending', 'In Progress', 'Completed', 'Failed QC', 'Blocked']

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [payForm, setPayForm] = useState({ amount: '', paymentType: 'PARTIAL', method: 'Cash', referenceNo: '', note: '' })

  useEffect(() => { if (id) loadAll() }, [id])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [o, it, st, n, p] = await Promise.all([
        invoke<any>('workorder:getWorkOrder', { id }),
        invoke<any[]>('workorder:getWorkOrderItems', { workOrderId: id }),
        invoke<any[]>('workorder:getWorkOrderStages', { workOrderId: id }),
        invoke<any[]>('workorder:getWorkOrderNotes', { workOrderId: id }),
        invoke<any[]>('payment:getPaymentsByOrder', { workOrderId: id })
      ])
      setOrder(o); setItems(it); setStages(st); setNotes(n); setPayments(p)
    } finally { setLoading(false) }
  }

  const handleStatusChange = async (status: string) => {
    await invoke('workorder:updateStatus', { id, status })
    loadAll()
  }

  const handleStageStatus = async (stageId: string, status: string) => {
    await invoke('workorder:updateStageStatus', { stageId, status })
    loadAll()
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    await invoke('workorder:addNote', { workOrderId: id, note: newNote, isInternal: false })
    setNewNote('')
    loadAll()
  }

  const handlePayment = async () => {
    try {
      await invoke('payment:recordPayment', {
        workOrderId: id,
        amount: parseFloat(payForm.amount),
        paymentType: payForm.paymentType,
        method: payForm.method,
        referenceNo: payForm.referenceNo || undefined,
        note: payForm.note || undefined
      })
      setShowPayment(false)
      setPayForm({ amount: '', paymentType: 'PARTIAL', method: 'Cash', referenceNo: '', note: '' })
      loadAll()
    } catch (e: any) { alert(e.message) }
  }

  const generateInvoice = async () => {
    if (!order) return
    const balance = order.totalAmount - order.discountAmount - order.paidAmount
    const html = `
      <!DOCTYPE html><html><head><style>
        body{font-family:Arial,sans-serif;padding:40px;color:#1A1A2E}
        .header{border-bottom:3px solid #C0392B;padding-bottom:20px;margin-bottom:20px}
        h1{color:#C0392B;margin:0}.order-no{font-size:18px;color:#666;margin-top:5px}
        table{width:100%;border-collapse:collapse;margin:20px 0}
        th{background:#1A1A2E;color:white;padding:8px;text-align:left}
        td{padding:8px;border-bottom:1px solid #eee}
        .totals{text-align:right;margin-top:20px}.totals td{border:none;padding:4px 8px}
        .total-row{font-weight:bold;font-size:18px;color:#C0392B}
      </style></head><body>
        <div class="header"><h1>Fashion Ka Ghar</h1><div class="order-no">Invoice: ${order.orderNo}</div></div>
        <p>Date: ${formatDate(new Date())}</p>
        <table><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
          ${items.map((i) => `<tr><td>${i.customDescription ?? i.productId ?? 'Item'}</td><td>${i.qty}</td><td>PKR ${i.unitPrice}</td><td>PKR ${i.qty * i.unitPrice}</td></tr>`).join('')}
        </table>
        <table class="totals">
          <tr><td>Subtotal:</td><td>PKR ${order.totalAmount}</td></tr>
          <tr><td>Discount:</td><td>PKR ${order.discountAmount}</td></tr>
          <tr><td>Paid:</td><td>PKR ${order.paidAmount}</td></tr>
          <tr class="total-row"><td>Balance Due:</td><td>PKR ${balance}</td></tr>
        </table>
      </body></html>
    `
    try {
      const path = await invoke<string>('pdf:generatePdf', { html, fileName: `invoice-${order.orderNo}.pdf` })
      alert(`Invoice saved: ${path}`)
    } catch (e: any) { alert(e.message) }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>
  if (!order) return <div className="text-center py-16 text-dark/40">Order not found</div>

  const balance = order.totalAmount - order.discountAmount - order.paidAmount

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/work-orders')} className="p-2 hover:bg-surface rounded-lg"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-dark">{order.orderNo}</h2>
            <StatusBadge status={order.status} />
            <StatusBadge status={order.priority} />
          </div>
          <div className="text-sm text-dark/50 mt-0.5">{order.category} · Due {formatDate(order.dueDate)}</div>
        </div>
        <div className="flex gap-2">
          <select value={order.status} onChange={(e) => handleStatusChange(e.target.value)} className="border border-app-border rounded-lg px-3 py-1.5 text-sm">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => setShowPayment(true)} className="flex items-center gap-2 bg-brand text-white px-3 py-1.5 rounded-lg text-sm"><CreditCard size={14} /> Record Payment</button>
          <button onClick={generateInvoice} className="flex items-center gap-2 border border-app-border px-3 py-1.5 rounded-lg text-sm hover:bg-surface"><FileText size={14} /> Invoice PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stage tracker */}
          <div className="bg-white rounded-card border border-app-border p-5">
            <h3 className="font-semibold text-dark mb-4">Production Stages</h3>
            <div className="space-y-2">
              {stages.map((stage) => (
                <div key={stage.id} className="flex items-center gap-3 p-3 rounded-lg border border-app-border">
                  <div className="shrink-0">
                    {stage.status === 'Completed' ? <CheckCircle size={18} className="text-green-500" /> :
                     stage.status === 'In Progress' ? <Circle size={18} className="text-amber-500 fill-amber-100" /> :
                     stage.status === 'Failed QC' ? <AlertCircle size={18} className="text-red-500" /> :
                     <Circle size={18} className="text-dark/20" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{stage.stageName}</div>
                    <div className="text-xs text-dark/40">{stage.vendorId ? `Vendor assigned` : 'In-house'} {stage.scheduledDate ? `· ${formatDate(stage.scheduledDate)}` : ''}</div>
                  </div>
                  <select value={stage.status} onChange={(e) => handleStageStatus(stage.id, e.target.value)} className="border border-app-border rounded-lg px-2 py-1 text-xs">
                    {STAGE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-card border border-app-border p-5">
            <h3 className="font-semibold text-dark mb-3">Order Items</h3>
            <table className="w-full text-sm">
              <thead><tr className="text-dark/50 text-left border-b border-app-border"><th className="pb-2">Description</th><th className="pb-2">Qty</th><th className="pb-2">Unit Price</th><th className="pb-2">Total</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-app-border last:border-0">
                    <td className="py-2">{item.customDescription ?? '—'}</td>
                    <td className="py-2">{item.qty}</td>
                    <td className="py-2">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2">{formatCurrency(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes / Timeline */}
          <div className="bg-white rounded-card border border-app-border p-5">
            <h3 className="font-semibold text-dark mb-3">Activity</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {notes.map((n) => (
                <div key={n.id} className="text-sm flex gap-2">
                  <span className="text-dark/30 text-xs shrink-0 mt-0.5">{formatDateTime(n.createdAt)}</span>
                  <span className={n.isInternal ? 'text-dark/50 italic' : 'text-dark'}>{n.note}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} placeholder="Add a note..." className="flex-1 border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              <button onClick={handleAddNote} className="bg-brand text-white px-3 rounded-lg text-sm"><Plus size={14} /></button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Financials */}
          <div className="bg-white rounded-card border border-app-border p-5">
            <h3 className="font-semibold text-dark mb-3">Financials</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-dark/60">Total:</span><span className="font-medium">{formatCurrency(order.totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-dark/60">Discount:</span><span>- {formatCurrency(order.discountAmount)}</span></div>
              <div className="flex justify-between"><span className="text-dark/60">Paid:</span><span className="text-green-600 font-medium">{formatCurrency(order.paidAmount)}</span></div>
              <div className="flex justify-between border-t border-app-border pt-2 font-semibold">
                <span>Balance:</span>
                <span className={balance > 0 ? 'text-brand' : 'text-green-600'}>{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-card border border-app-border p-5">
            <h3 className="font-semibold text-dark mb-3">Payment History</h3>
            <div className="space-y-2">
              {payments.length === 0 && <p className="text-dark/40 text-xs">No payments yet</p>}
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <div>
                    <StatusBadge status={p.paymentType} />
                    <span className="text-xs text-dark/40 ml-1">{p.method}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPayment(false)} />
          <div className="relative bg-white rounded-card shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-dark mb-4">Record Payment</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-dark/60 mb-1 block">Amount</label>
                <input type="number" value={payForm.amount} onChange={(e) => setPayForm({...payForm, amount: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" placeholder={`Balance: ${balance}`} />
              </div>
              <div>
                <label className="text-sm text-dark/60 mb-1 block">Type</label>
                <select value={payForm.paymentType} onChange={(e) => setPayForm({...payForm, paymentType: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm">
                  <option value="PARTIAL">Partial</option><option value="FINAL">Final</option><option value="ADVANCE">Advance</option><option value="REFUND">Refund</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-dark/60 mb-1 block">Method</label>
                <select value={payForm.method} onChange={(e) => setPayForm({...payForm, method: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm">
                  <option>Cash</option><option>Bank Transfer</option><option>Card</option><option>Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-dark/60 mb-1 block">Reference No</label>
                <input value={payForm.referenceNo} onChange={(e) => setPayForm({...payForm, referenceNo: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPayment(false)} className="flex-1 border border-app-border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handlePayment} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium">Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
