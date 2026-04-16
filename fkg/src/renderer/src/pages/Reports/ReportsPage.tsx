import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { invoke } from '../../lib/api'
import { DataTable, Column } from '../../components/common/DataTable'
import { formatCurrency } from '../../lib/utils'

type ReportTab = 'revenue' | 'inventory' | 'customers' | 'vendors' | 'expenses'

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('revenue')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])

  useEffect(() => { loadReport() }, [tab, dateFrom, dateTo, groupBy])

  const loadReport = async () => {
    setLoading(true)
    try {
      let result: any[] = []
      if (tab === 'revenue') result = await invoke('report:getRevenueReport', { dateFrom, dateTo, groupBy })
      else if (tab === 'inventory') result = await invoke('report:getInventoryReport')
      else if (tab === 'customers') result = await invoke('report:getCustomerReport')
      else if (tab === 'vendors') result = await invoke('report:getVendorReport', { dateFrom, dateTo })
      else if (tab === 'expenses') result = await invoke('report:getExpensesReport', { dateFrom, dateTo })
      setData(result)
    } finally { setLoading(false) }
  }

  const inventoryCols: Column<any>[] = [
    { key: 'sku', header: 'SKU', render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
    { key: 'name', header: 'Product' },
    { key: 'available', header: 'Available', render: (r) => <span className={r.available <= 5 ? 'text-red-600 font-semibold' : ''}>{r.available}</span> },
    { key: 'costPrice', header: 'Cost', render: (r) => formatCurrency(r.costPrice) },
    { key: 'sellPrice', header: 'Price', render: (r) => formatCurrency(r.sellPrice) },
    { key: 'totalValue', header: 'Stock Value', render: (r) => formatCurrency(r.totalValue) }
  ]

  const customerCols: Column<any>[] = [
    { key: 'name', header: 'Customer' },
    { key: 'orderCount', header: 'Orders' },
    { key: 'totalSpent', header: 'Total Spent', render: (r) => formatCurrency(r.totalSpent ?? 0) },
    { key: 'loyaltyPoints', header: 'Points' },
    { key: 'loyaltyTier', header: 'Tier', render: (r) => <span className="capitalize">{r.loyaltyTier}</span> }
  ]

  const vendorCols: Column<any>[] = [
    { key: 'name', header: 'Vendor' },
    { key: 'orderCount', header: 'Orders' },
    { key: 'totalPaid', header: 'Total Paid', render: (r) => formatCurrency(r.totalPaid ?? 0) },
    { key: 'avgRating', header: 'Rating', render: (r) => r.avgRating ? `${r.avgRating.toFixed(1)} ★` : '—' }
  ]

  const expenseCols: Column<any>[] = [
    { key: 'category', header: 'Category' },
    { key: 'count', header: 'Count' },
    { key: 'total', header: 'Total', render: (r) => formatCurrency(r.total) }
  ]

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-app-border">
        {(['revenue','inventory','customers','vendors','expenses'] as ReportTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 transition-colors ${tab === t ? 'border-brand text-brand' : 'border-transparent text-dark/50 hover:text-dark'}`}>{t}</button>
        ))}
      </div>

      {/* Date filters */}
      {(tab === 'revenue' || tab === 'vendors' || tab === 'expenses') && (
        <div className="flex items-center gap-3">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-app-border rounded-lg px-3 py-1.5 text-sm" />
          <span className="text-dark/40">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-app-border rounded-lg px-3 py-1.5 text-sm" />
          {tab === 'revenue' && (
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as 'day' | 'month')} className="border border-app-border rounded-lg px-3 py-1.5 text-sm">
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
            </select>
          )}
        </div>
      )}

      {/* Revenue chart */}
      {tab === 'revenue' && (
        <div className="space-y-5">
          <div className="bg-white rounded-card border border-app-border p-5">
            <h3 className="font-semibold text-dark mb-4">Revenue vs Cost</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data}>
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#C0392B" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="vendorCost" fill="#2C3E50" radius={[4, 4, 0, 0]} name="Vendor Cost" />
                <Bar dataKey="expenses" fill="#D4AC0D" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-card border border-app-border p-5">
            <h3 className="font-semibold text-dark mb-4">Profit Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Line dataKey="profit" stroke="#27AE60" strokeWidth={2} dot={false} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Summary row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: data.reduce((s, r) => s + (r.revenue ?? 0), 0) },
              { label: 'Vendor Cost', value: data.reduce((s, r) => s + (r.vendorCost ?? 0), 0) },
              { label: 'Expenses', value: data.reduce((s, r) => s + (r.expenses ?? 0), 0) },
              { label: 'Net Profit', value: data.reduce((s, r) => s + (r.profit ?? 0), 0) }
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-card border border-app-border p-4">
                <div className="text-xs text-dark/50">{label}</div>
                <div className="text-xl font-bold text-dark mt-1">{formatCurrency(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'inventory' && <DataTable columns={inventoryCols} data={data} loading={loading} keyExtractor={(r) => r.id} />}
      {tab === 'customers' && <DataTable columns={customerCols} data={data} loading={loading} keyExtractor={(r) => r.customerId} />}
      {tab === 'vendors' && <DataTable columns={vendorCols} data={data} loading={loading} keyExtractor={(r) => r.vendorId} />}
      {tab === 'expenses' && (
        <div>
          <DataTable columns={expenseCols} data={data} loading={loading} keyExtractor={(r) => r.category} />
          {data.length > 0 && (
            <div className="mt-3 text-right font-semibold text-dark">
              Total: {formatCurrency(data.reduce((s, r) => s + r.total, 0))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
