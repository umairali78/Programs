import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, ShoppingBag, AlertTriangle, Clock, DollarSign, Package } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { invoke } from '../../lib/api'
import { KPICard } from '../../components/common/KPICard'
import { formatCurrency, formatDate } from '../../lib/utils'
import { StatusBadge } from '../../components/common/StatusBadge'

const COLORS = ['#C0392B', '#2C3E50', '#D4AC0D', '#27AE60', '#8E44AD', '#2980B9']

export function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [overdueOrders, setOverdueOrders] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      const [k, cat, orders, overdue] = await Promise.all([
        invoke<any>('report:getDashboardKPIs'),
        invoke<any[]>('report:getOrdersByCategory'),
        invoke<any[]>('workorder:listWorkOrders', { status: undefined }),
        invoke<any[]>('workorder:getOverdueOrders')
      ])
      setKpis(k)
      setCategoryData(cat.slice(0, 6))
      setRecentOrders(orders.slice(0, 5))
      setOverdueOrders(overdue.slice(0, 5))

      // Revenue for last 30 days
      const to = new Date().toISOString().split('T')[0]
      const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
      const rev = await invoke<any[]>('report:getRevenueReport', { dateFrom: from, dateTo: to, groupBy: 'day' })
      setRevenueData(rev.slice(-14))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Revenue"
          value={formatCurrency(kpis?.todayRevenue ?? 0)}
          icon={TrendingUp}
          iconColor="text-green-600"
        />
        <KPICard
          title="Month Revenue"
          value={formatCurrency(kpis?.monthRevenue ?? 0)}
          icon={DollarSign}
          iconColor="text-brand"
        />
        <KPICard
          title="Active Orders"
          value={kpis?.activeOrders ?? 0}
          icon={ShoppingBag}
          iconColor="text-blue-600"
        />
        <KPICard
          title="Overdue Orders"
          value={kpis?.overdueOrders ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-600"
        />
        <KPICard
          title="Pending Payments"
          value={formatCurrency(kpis?.pendingPayments ?? 0)}
          icon={Clock}
          iconColor="text-amber-600"
        />
        <KPICard
          title="Low Stock Items"
          value={kpis?.lowStockCount ?? 0}
          icon={Package}
          iconColor="text-orange-600"
        />
        <KPICard
          title="Deliveries (7 days)"
          value={kpis?.upcomingDeliveries ?? 0}
          icon={ShoppingBag}
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-card border border-app-border p-5">
          <h3 className="font-semibold text-dark mb-4">Revenue — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="period" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#C0392B" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="vendorCost" fill="#2C3E50" radius={[4, 4, 0, 0]} name="Vendor Cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="bg-white rounded-card border border-app-border p-5">
          <h3 className="font-semibold text-dark mb-4">Orders by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-dark/30 text-sm">No data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-card border border-app-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark">Recent Orders</h3>
            <button onClick={() => navigate('/work-orders')} className="text-brand text-sm hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 && <p className="text-dark/40 text-sm text-center py-4">No orders yet</p>}
            {recentOrders.map((o) => (
              <div key={o.id} onClick={() => navigate(`/work-orders/${o.id}`)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-dark">{o.orderNo}</div>
                  <div className="text-xs text-dark/40">{formatCurrency(o.totalAmount)} · Due {formatDate(o.dueDate)}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Overdue Orders */}
        <div className="bg-white rounded-card border border-app-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark">Overdue Orders</h3>
            <span className="text-xs text-red-500 font-medium">{overdueOrders.length} overdue</span>
          </div>
          <div className="space-y-2">
            {overdueOrders.length === 0 && <p className="text-dark/40 text-sm text-center py-4">No overdue orders</p>}
            {overdueOrders.map((o) => (
              <div key={o.id} onClick={() => navigate(`/work-orders/${o.id}`)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface cursor-pointer border border-red-100">
                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-dark">{o.orderNo}</div>
                  <div className="text-xs text-red-500">Due {formatDate(o.dueDate)}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
