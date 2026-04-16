import { eq, desc, and } from 'drizzle-orm'
import { getDb, getSqlite } from '../db'
import { payments, vendorPayments, expenses, workOrders, installments } from '../db/schema'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'
import type { Payment, VendorPayment, Expense } from '../db/schema'

export class PaymentService extends BaseService {
  async recordPayment(data: {
    workOrderId: string
    amount: number
    paymentType: 'ADVANCE' | 'PARTIAL' | 'FINAL' | 'REFUND'
    method: string
    referenceNo?: string
    note?: string
    receivedBy?: string
    loyaltyPointsToAdd?: number
    customerId?: string
  }): Promise<Payment> {
    const db = getDb()
    const sqlite = getSqlite()
    const now = new Date()
    const id = newId()

    sqlite.transaction(() => {
      // Record payment
      sqlite
        .prepare(
          `INSERT INTO payments (id, work_order_id, amount, payment_type, method, reference_no, note, received_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(id, data.workOrderId, data.amount, data.paymentType, data.method, data.referenceNo ?? null, data.note ?? null, data.receivedBy ?? null, now.getTime())

      // Update order paid amount
      const isRefund = data.paymentType === 'REFUND'
      sqlite
        .prepare(`UPDATE work_orders SET paid_amount = paid_amount + ?, updated_at = ? WHERE id = ?`)
        .run(isRefund ? -data.amount : data.amount, now.getTime(), data.workOrderId)

      // Add loyalty points if customer provided
      if (data.loyaltyPointsToAdd && data.customerId) {
        sqlite
          .prepare(`UPDATE customers SET loyalty_points = loyalty_points + ?, updated_at = ? WHERE id = ?`)
          .run(data.loyaltyPointsToAdd, now.getTime(), data.customerId)
      }
    })()

    this.auditLog({ action: 'PAYMENT_RECORDED', entityType: 'payment', entityId: id, newValue: data })
    const [p] = await db.select().from(payments).where(eq(payments.id, id))
    return p
  }

  async getPaymentsByOrder(workOrderId: string): Promise<Payment[]> {
    const db = getDb()
    return db.select().from(payments).where(eq(payments.workOrderId, workOrderId)).orderBy(desc(payments.createdAt))
  }

  async getVendorPayments(filters?: { vendorId?: string; status?: string }): Promise<VendorPayment[]> {
    const db = getDb()
    let rows = await db.select().from(vendorPayments).orderBy(desc(vendorPayments.createdAt))
    if (filters?.vendorId) rows = rows.filter((r) => r.vendorId === filters.vendorId)
    if (filters?.status) rows = rows.filter((r) => r.status === filters.status)
    return rows
  }

  async markVendorPaymentPaid(id: string, paidBy?: string, referenceNo?: string): Promise<void> {
    const db = getDb()
    const sqlite = getSqlite()
    const now = new Date()

    sqlite.transaction(() => {
      sqlite
        .prepare(`UPDATE vendor_payments SET status = 'Paid', paid_at = ?, paid_by = ?, reference_no = ?, updated_at = ? WHERE id = ?`)
        .run(now.getTime(), paidBy ?? null, referenceNo ?? null, now.getTime(), id)

      // Update vendor total_paid
      const [vp] = sqlite.prepare(`SELECT * FROM vendor_payments WHERE id = ?`).all(id) as any[]
      if (vp) {
        sqlite.prepare(`UPDATE vendors SET total_paid = total_paid + ?, updated_at = ? WHERE id = ?`).run(vp.amount, now.getTime(), vp.vendor_id)
      }
    })()

    this.auditLog({ action: 'VENDOR_PAYMENT_PAID', entityType: 'vendor_payment', entityId: id })
  }

  async listExpenses(filters?: { category?: string; dateFrom?: string; dateTo?: string }): Promise<Expense[]> {
    const db = getDb()
    let rows = await db.select().from(expenses).orderBy(desc(expenses.createdAt))
    if (filters?.category) rows = rows.filter((e) => e.category === filters.category)
    if (filters?.dateFrom) rows = rows.filter((e) => e.expenseDate >= filters.dateFrom!)
    if (filters?.dateTo) rows = rows.filter((e) => e.expenseDate <= filters.dateTo!)
    return rows
  }

  async createExpense(data: Omit<typeof expenses.$inferInsert, 'id' | 'createdAt'>): Promise<Expense> {
    const db = getDb()
    const id = newId()
    await db.insert(expenses).values({ id, ...data, createdAt: new Date() })
    this.auditLog({ action: 'EXPENSE_CREATED', entityType: 'expense', entityId: id, newValue: data })
    const [e] = await db.select().from(expenses).where(eq(expenses.id, id))
    return e
  }

  async createInstallmentPlan(
    workOrderId: string,
    installmentList: Array<{ amount: number; dueDate: string }>
  ): Promise<void> {
    const db = getDb()
    for (const inst of installmentList) {
      await db.insert(installments).values({
        id: newId(),
        workOrderId,
        amount: inst.amount,
        dueDate: inst.dueDate,
        status: 'Pending',
        createdAt: new Date()
      })
    }
  }

  async getInstallments(workOrderId: string): Promise<typeof installments.$inferSelect[]> {
    const db = getDb()
    return db.select().from(installments).where(eq(installments.workOrderId, workOrderId))
  }

  async getOrderBalance(workOrderId: string): Promise<number> {
    const db = getDb()
    const [order] = await db.select().from(workOrders).where(eq(workOrders.id, workOrderId))
    if (!order) return 0
    return order.totalAmount - order.discountAmount - order.paidAmount
  }

  async getRecentPayments(limit = 10): Promise<Payment[]> {
    const db = getDb()
    return db.select().from(payments).orderBy(desc(payments.createdAt)).limit(limit)
  }

  async getTotalRevenue(dateFrom?: string, dateTo?: string): Promise<number> {
    const db = getDb()
    let rows = await db.select().from(payments)
    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      rows = rows.filter((p) => p.createdAt.getTime() >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime()
      rows = rows.filter((p) => p.createdAt.getTime() <= to)
    }
    return rows.reduce((sum, p) => sum + (p.paymentType === 'REFUND' ? -p.amount : p.amount), 0)
  }
}
