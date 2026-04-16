import { isNull, desc } from 'drizzle-orm'
import { getDb, getSqlite } from '../db'
import { payments, workOrders, expenses, products, customers, vendorPayments, staff, staffAttendance } from '../db/schema'
import { BaseService } from './base.service'

export interface RevenueRow {
  period: string
  revenue: number
  vendorCost: number
  expenses: number
  profit: number
}

export class ReportService extends BaseService {
  async getRevenueReport(dateFrom: string, dateTo: string, groupBy: 'day' | 'month'): Promise<RevenueRow[]> {
    const sqlite = getSqlite()
    const from = new Date(dateFrom).getTime()
    const to = new Date(dateTo + 'T23:59:59').getTime()

    const fmt = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m'

    const rows = sqlite
      .prepare(
        `SELECT strftime('${fmt}', created_at / 1000, 'unixepoch') AS period,
          SUM(CASE WHEN payment_type != 'REFUND' THEN amount ELSE -amount END) AS revenue
         FROM payments
         WHERE created_at >= ? AND created_at <= ?
         GROUP BY period ORDER BY period`
      )
      .all(from, to) as Array<{ period: string; revenue: number }>

    const costRows = sqlite
      .prepare(
        `SELECT strftime('${fmt}', created_at / 1000, 'unixepoch') AS period,
          SUM(amount) AS cost
         FROM vendor_payments
         WHERE status = 'Paid' AND paid_at >= ? AND paid_at <= ?
         GROUP BY period ORDER BY period`
      )
      .all(from, to) as Array<{ period: string; cost: number }>

    const expenseRows = sqlite
      .prepare(
        `SELECT strftime('${fmt}', CAST(strftime('%s', expense_date) AS INTEGER) * 1000 / 1000, 'unixepoch') AS period,
          SUM(amount) AS total
         FROM expenses
         WHERE expense_date >= ? AND expense_date <= ?
         GROUP BY period ORDER BY period`
      )
      .all(dateFrom, dateTo) as Array<{ period: string; total: number }>

    const costMap = Object.fromEntries(costRows.map((r) => [r.period, r.cost]))
    const expMap = Object.fromEntries(expenseRows.map((r) => [r.period, r.total]))

    return rows.map((r) => ({
      period: r.period,
      revenue: r.revenue ?? 0,
      vendorCost: costMap[r.period] ?? 0,
      expenses: expMap[r.period] ?? 0,
      profit: (r.revenue ?? 0) - (costMap[r.period] ?? 0) - (expMap[r.period] ?? 0)
    }))
  }

  async getDashboardKPIs(): Promise<{
    todayRevenue: number
    monthRevenue: number
    activeOrders: number
    overdueOrders: number
    pendingPayments: number
    lowStockCount: number
    upcomingDeliveries: number
  }> {
    const sqlite = getSqlite()
    const today = new Date().toISOString().split('T')[0]
    const monthStart = today.substring(0, 7) + '-01'
    const todayStart = new Date(today).getTime()
    const todayEnd = todayStart + 86400000

    const monthStartTs = new Date(monthStart).getTime()

    const todayRevenue = (sqlite
      .prepare(`SELECT SUM(CASE WHEN payment_type != 'REFUND' THEN amount ELSE -amount END) AS v FROM payments WHERE created_at >= ? AND created_at < ?`)
      .get(todayStart, todayEnd) as any)?.v ?? 0

    const monthRevenue = (sqlite
      .prepare(`SELECT SUM(CASE WHEN payment_type != 'REFUND' THEN amount ELSE -amount END) AS v FROM payments WHERE created_at >= ?`)
      .get(monthStartTs) as any)?.v ?? 0

    const activeOrders = (sqlite
      .prepare(`SELECT COUNT(*) AS v FROM work_orders WHERE status NOT IN ('Delivered','Cancelled') AND deleted_at IS NULL`)
      .get() as any)?.v ?? 0

    const overdueOrders = (sqlite
      .prepare(`SELECT COUNT(*) AS v FROM work_orders WHERE due_date < ? AND status NOT IN ('Delivered','Cancelled') AND deleted_at IS NULL`)
      .get(today) as any)?.v ?? 0

    const pendingPayments = (sqlite
      .prepare(`SELECT SUM(total_amount - discount_amount - paid_amount) AS v FROM work_orders WHERE status NOT IN ('Delivered','Cancelled') AND deleted_at IS NULL`)
      .get() as any)?.v ?? 0

    const lowStockCount = (sqlite
      .prepare(`SELECT COUNT(*) AS v FROM products WHERE stock_qty - reserved_qty <= low_stock_threshold AND status != 'discontinued' AND deleted_at IS NULL`)
      .get() as any)?.v ?? 0

    const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const upcomingDeliveries = (sqlite
      .prepare(`SELECT COUNT(*) AS v FROM work_orders WHERE due_date >= ? AND due_date <= ? AND status NOT IN ('Delivered','Cancelled') AND deleted_at IS NULL`)
      .get(today, in7days) as any)?.v ?? 0

    return { todayRevenue, monthRevenue, activeOrders, overdueOrders, pendingPayments, lowStockCount, upcomingDeliveries }
  }

  async getOrdersByCategory(): Promise<Array<{ category: string; count: number; revenue: number }>> {
    const sqlite = getSqlite()
    return sqlite
      .prepare(
        `SELECT wo.category, COUNT(*) AS count, SUM(p.amount) AS revenue
         FROM work_orders wo
         LEFT JOIN payments p ON p.work_order_id = wo.id AND p.payment_type != 'REFUND'
         WHERE wo.deleted_at IS NULL
         GROUP BY wo.category ORDER BY count DESC`
      )
      .all() as any[]
  }

  async getVendorReport(dateFrom: string, dateTo: string): Promise<Array<{ vendorId: string; name: string; totalPaid: number; orderCount: number; avgRating: number }>> {
    const sqlite = getSqlite()
    return sqlite
      .prepare(
        `SELECT v.id AS vendorId, v.name, v.total_paid AS totalPaid, v.rating_avg AS avgRating,
          COUNT(DISTINCT vp.work_order_id) AS orderCount
         FROM vendors v
         LEFT JOIN vendor_payments vp ON vp.vendor_id = v.id AND vp.status = 'Paid'
           AND vp.paid_at >= ? AND vp.paid_at <= ?
         WHERE v.deleted_at IS NULL
         GROUP BY v.id ORDER BY totalPaid DESC`
      )
      .all(new Date(dateFrom).getTime(), new Date(dateTo + 'T23:59:59').getTime()) as any[]
  }

  async getInventoryReport(): Promise<Array<{ id: string; sku: string; name: string; stockQty: number; reservedQty: number; available: number; costPrice: number; sellPrice: number; totalValue: number }>> {
    const sqlite = getSqlite()
    return (sqlite
      .prepare(
        `SELECT id, sku, name, stock_qty AS stockQty, reserved_qty AS reservedQty,
          stock_qty - reserved_qty AS available,
          cost_price AS costPrice, sell_price AS sellPrice,
          stock_qty * cost_price AS totalValue
         FROM products WHERE deleted_at IS NULL ORDER BY name`
      )
      .all() as any[])
  }

  async getCustomerReport(): Promise<Array<{ customerId: string; name: string; orderCount: number; totalSpent: number; loyaltyPoints: number; loyaltyTier: string }>> {
    const sqlite = getSqlite()
    return sqlite
      .prepare(
        `SELECT c.id AS customerId, c.name, c.loyalty_points AS loyaltyPoints, c.loyalty_tier AS loyaltyTier,
          COUNT(DISTINCT wo.id) AS orderCount,
          SUM(CASE WHEN p.payment_type != 'REFUND' THEN p.amount ELSE -p.amount END) AS totalSpent
         FROM customers c
         LEFT JOIN work_orders wo ON wo.customer_id = c.id AND wo.deleted_at IS NULL
         LEFT JOIN payments p ON p.work_order_id = wo.id
         WHERE c.deleted_at IS NULL
         GROUP BY c.id ORDER BY totalSpent DESC`
      )
      .all() as any[]
  }

  async getStaffReport(month: string): Promise<Array<{ staffId: string; name: string; present: number; absent: number; pendingCommission: number }>> {
    const sqlite = getSqlite()
    const members = sqlite.prepare(`SELECT id, name FROM staff WHERE deleted_at IS NULL`).all() as any[]
    return members.map((m) => {
      const present = (sqlite.prepare(`SELECT COUNT(*) AS v FROM staff_attendance WHERE staff_id = ? AND date LIKE ? AND status = 'PRESENT'`).get(m.id, `${month}%`) as any)?.v ?? 0
      const absent = (sqlite.prepare(`SELECT COUNT(*) AS v FROM staff_attendance WHERE staff_id = ? AND date LIKE ? AND status = 'ABSENT'`).get(m.id, `${month}%`) as any)?.v ?? 0
      const pendingCommission = (sqlite.prepare(`SELECT SUM(amount) AS v FROM staff_commissions WHERE staff_id = ? AND status = 'Pending'`).get(m.id) as any)?.v ?? 0
      return { staffId: m.id, name: m.name, present, absent, pendingCommission }
    })
  }

  async getExpensesReport(dateFrom: string, dateTo: string): Promise<Array<{ category: string; total: number; count: number }>> {
    const sqlite = getSqlite()
    return sqlite
      .prepare(
        `SELECT category, SUM(amount) AS total, COUNT(*) AS count
         FROM expenses
         WHERE expense_date >= ? AND expense_date <= ?
         GROUP BY category ORDER BY total DESC`
      )
      .all(dateFrom, dateTo) as any[]
  }
}
