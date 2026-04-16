import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { invoke } from '../../lib/api'

interface Customer { id: string; name: string; phone?: string }
interface Vendor { id: string; name: string }

interface Props { onClose: () => void; onSaved: () => void }

const CATEGORIES = ['Stitching', 'Embroidery', 'Alteration', 'Finishing', 'Designing', 'Rental']
const ORDER_TYPES = ['NEW', 'ALTERATION', 'REPAIR', 'RENTAL']
const PRIORITIES = ['Urgent', 'Normal', 'Flexible']
const DEFAULT_STAGES = ['Cutting', 'Stitching', 'Embroidery', 'Finishing', 'Quality Check', 'Delivery']

export function WorkOrderForm({ onClose, onSaved }: Props) {
  const [step, setStep] = useState(0)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(false)

  const [order, setOrder] = useState({
    customerId: '', category: 'Stitching', orderType: 'NEW', priority: 'Normal',
    dueDate: '', totalAmount: '', discountAmount: '0', notes: ''
  })
  const [items, setItems] = useState([{ customDescription: '', qty: '1', unitPrice: '', customizationNotes: '' }])
  const [stages, setStages] = useState(DEFAULT_STAGES.map((s, i) => ({ stageName: s, sortOrder: i, vendorId: '', vendorCost: '0', scheduledDate: '' })))
  const [advance, setAdvance] = useState({ amount: '', method: 'Cash', referenceNo: '' })

  useEffect(() => {
    Promise.all([
      invoke<Customer[]>('customer:listCustomers', {}),
      invoke<Vendor[]>('vendor:listVendors', {})
    ]).then(([c, v]) => { setCustomers(c); setVendors(v) })
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await invoke('workorder:createWorkOrder', {
        customerId: order.customerId,
        category: order.category,
        orderType: order.orderType,
        priority: order.priority,
        dueDate: order.dueDate || undefined,
        totalAmount: parseFloat(order.totalAmount) || 0,
        discountAmount: parseFloat(order.discountAmount) || 0,
        notes: order.notes || undefined,
        items: items.map((i) => ({
          customDescription: i.customDescription || undefined,
          qty: parseInt(i.qty) || 1,
          unitPrice: parseFloat(i.unitPrice) || 0,
          customizationNotes: i.customizationNotes || undefined
        })),
        stages: stages.map((s) => ({
          stageName: s.stageName,
          sortOrder: s.sortOrder,
          vendorId: s.vendorId || undefined,
          vendorCost: parseFloat(s.vendorCost) || 0,
          scheduledDate: s.scheduledDate || undefined
        })),
        advancePayment: advance.amount ? {
          amount: parseFloat(advance.amount),
          method: advance.method,
          referenceNo: advance.referenceNo || undefined
        } : undefined
      })
      onSaved()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const STEPS = ['Order Details', 'Items', 'Stages', 'Payment']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-card shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-app-border shrink-0">
          <h2 className="font-semibold text-dark">New Work Order</h2>
          <div className="flex gap-2 mt-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer ${i <= step ? 'bg-brand text-white' : 'bg-surface text-dark/40'}`} onClick={() => i < step && setStep(i)}>{i + 1}</div>
                {i < STEPS.length - 1 && <div className={`h-0.5 w-8 ${i < step ? 'bg-brand' : 'bg-app-border'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 0 && (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-dark/60 mb-1 block">Customer *</label>
                <select value={order.customerId} onChange={(e) => setOrder({...order, customerId: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select customer...</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-dark/60 mb-1 block">Category</label>
                  <select value={order.category} onChange={(e) => setOrder({...order, category: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-dark/60 mb-1 block">Order Type</label>
                  <select value={order.orderType} onChange={(e) => setOrder({...order, orderType: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm">
                    {ORDER_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-dark/60 mb-1 block">Priority</label>
                  <select value={order.priority} onChange={(e) => setOrder({...order, priority: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm">
                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-dark/60 mb-1 block">Due Date</label>
                  <input type="date" value={order.dueDate} onChange={(e) => setOrder({...order, dueDate: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-dark/60 mb-1 block">Total Amount *</label>
                  <input type="number" value={order.totalAmount} onChange={(e) => setOrder({...order, totalAmount: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-dark/60 mb-1 block">Discount</label>
                  <input type="number" value={order.discountAmount} onChange={(e) => setOrder({...order, discountAmount: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm text-dark/60 mb-1 block">Notes</label>
                <textarea value={order.notes} onChange={(e) => setOrder({...order, notes: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm resize-none" rows={2} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="border border-app-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Item {idx + 1}</span>
                    {items.length > 1 && <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>}
                  </div>
                  <div>
                    <label className="text-xs text-dark/60 mb-1 block">Description</label>
                    <input value={item.customDescription} onChange={(e) => setItems(items.map((it, i) => i === idx ? {...it, customDescription: e.target.value} : it))} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Bridal Lehnga" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-dark/60 mb-1 block">Qty</label>
                      <input type="number" value={item.qty} onChange={(e) => setItems(items.map((it, i) => i === idx ? {...it, qty: e.target.value} : it))} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-dark/60 mb-1 block">Unit Price</label>
                      <input type="number" value={item.unitPrice} onChange={(e) => setItems(items.map((it, i) => i === idx ? {...it, unitPrice: e.target.value} : it))} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-dark/60 mb-1 block">Customization Notes</label>
                    <input value={item.customizationNotes} onChange={(e) => setItems(items.map((it, i) => i === idx ? {...it, customizationNotes: e.target.value} : it))} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              ))}
              <button onClick={() => setItems([...items, { customDescription: '', qty: '1', unitPrice: '', customizationNotes: '' }])} className="flex items-center gap-2 text-sm text-brand hover:underline">
                <Plus size={14} /> Add Item
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              {stages.map((stage, idx) => (
                <div key={idx} className="border border-app-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <input value={stage.stageName} onChange={(e) => setStages(stages.map((s, i) => i === idx ? {...s, stageName: e.target.value} : s))} className="font-medium text-sm bg-transparent border-none outline-none flex-1" />
                    {stages.length > 1 && <button onClick={() => setStages(stages.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 size={13} /></button>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-dark/60 mb-1 block">Vendor</label>
                      <select value={stage.vendorId} onChange={(e) => setStages(stages.map((s, i) => i === idx ? {...s, vendorId: e.target.value} : s))} className="w-full border border-app-border rounded-lg px-2 py-1.5 text-xs">
                        <option value="">None</option>
                        {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-dark/60 mb-1 block">Vendor Cost</label>
                      <input type="number" value={stage.vendorCost} onChange={(e) => setStages(stages.map((s, i) => i === idx ? {...s, vendorCost: e.target.value} : s))} className="w-full border border-app-border rounded-lg px-2 py-1.5 text-xs" />
                    </div>
                    <div>
                      <label className="text-xs text-dark/60 mb-1 block">Scheduled Date</label>
                      <input type="date" value={stage.scheduledDate} onChange={(e) => setStages(stages.map((s, i) => i === idx ? {...s, scheduledDate: e.target.value} : s))} className="w-full border border-app-border rounded-lg px-2 py-1.5 text-xs" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setStages([...stages, { stageName: 'New Stage', sortOrder: stages.length, vendorId: '', vendorCost: '0', scheduledDate: '' }])} className="flex items-center gap-2 text-sm text-brand hover:underline">
                <Plus size={14} /> Add Stage
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-dark">Advance Payment (Optional)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-dark/60 mb-1 block">Amount</label>
                  <input type="number" value={advance.amount} onChange={(e) => setAdvance({...advance, amount: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm text-dark/60 mb-1 block">Method</label>
                  <select value={advance.method} onChange={(e) => setAdvance({...advance, method: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm">
                    <option>Cash</option><option>Bank Transfer</option><option>Card</option><option>Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-dark/60 mb-1 block">Reference No</label>
                <input value={advance.referenceNo} onChange={(e) => setAdvance({...advance, referenceNo: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2 text-sm" />
              </div>
              {/* Summary */}
              <div className="bg-surface rounded-lg p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-dark/60">Total Amount:</span><span className="font-medium">PKR {parseFloat(order.totalAmount) || 0}</span></div>
                <div className="flex justify-between"><span className="text-dark/60">Discount:</span><span>PKR {parseFloat(order.discountAmount) || 0}</span></div>
                <div className="flex justify-between"><span className="text-dark/60">Advance:</span><span>PKR {parseFloat(advance.amount) || 0}</span></div>
                <div className="flex justify-between font-semibold border-t border-app-border pt-1 mt-1">
                  <span>Balance:</span>
                  <span className="text-brand">PKR {((parseFloat(order.totalAmount) || 0) - (parseFloat(order.discountAmount) || 0) - (parseFloat(advance.amount) || 0)).toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-app-border flex gap-3 shrink-0">
          <button onClick={onClose} className="border border-app-border rounded-lg px-4 py-2 text-sm hover:bg-surface">Cancel</button>
          {step > 0 && <button onClick={() => setStep(step - 1)} className="border border-app-border rounded-lg px-4 py-2 text-sm hover:bg-surface">Back</button>}
          <div className="flex-1" />
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} disabled={step === 0 && !order.customerId} className="bg-brand text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-brand/90 disabled:opacity-50">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="bg-brand text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-brand/90 disabled:opacity-60">
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
