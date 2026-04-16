import { eq, isNull, desc, and, ne } from 'drizzle-orm'
import { getDb, getSqlite } from '../db'
import {
  workOrders,
  workOrderItems,
  workOrderStages,
  workOrderNotes,
  vendorPayments,
  fabricMovements,
  products,
  coupons
} from '../db/schema'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'
import type { WorkOrder, NewWorkOrder, WorkOrderStage } from '../db/schema'

export interface CreateWorkOrderData {
  customerId: string
  category: string
  orderType: string
  priority: string
  dueDate?: string
  notes?: string
  totalAmount: number
  discountAmount?: number
  discountReason?: string
  couponId?: string
  taxAmount?: number
  vendorCostTotal?: number
  customerApprovalRequired?: boolean
  items: Array<{
    productId?: string
    customDescription?: string
    qty: number
    unitPrice: number
    customizationNotes?: string
    measurementId?: string
    fabricId?: string
    fabricQty?: number
  }>
  stages: Array<{
    stageName: string
    sortOrder: number
    vendorId?: string
    serviceTier?: string
    vendorCost?: number
    scheduledDate?: string
  }>
  advancePayment?: {
    amount: number
    method: string
    referenceNo?: string
  }
  createdBy?: string
}

export class WorkOrderService extends BaseService {
  async listWorkOrders(filters?: {
    status?: string
    orderType?: string
    customerId?: string
    search?: string
    overdue?: boolean
  }): Promise<WorkOrder[]> {
    const db = getDb()
    let rows = await db.select().from(workOrders).where(isNull(workOrders.deletedAt)).orderBy(desc(workOrders.createdAt))

    if (filters?.status) rows = rows.filter((o) => o.status === filters.status)
    if (filters?.orderType) rows = rows.filter((o) => o.orderType === filters.orderType)
    if (filters?.customerId) rows = rows.filter((o) => o.customerId === filters.customerId)
    if (filters?.search) {
      const s = filters.search.toLowerCase()
      rows = rows.filter((o) => o.orderNo.toLowerCase().includes(s))
    }
    if (filters?.overdue) {
      const today = new Date().toISOString().split('T')[0]
      rows = rows.filter((o) => o.dueDate && o.dueDate < today && !['Delivered', 'Cancelled'].includes(o.status))
    }
    return rows
  }

  async getWorkOrder(id: string): Promise<WorkOrder | null> {
    const db = getDb()
    const [row] = await db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.id, id), isNull(workOrders.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async getWorkOrderItems(workOrderId: string): Promise<typeof workOrderItems.$inferSelect[]> {
    const db = getDb()
    return db.select().from(workOrderItems).where(eq(workOrderItems.workOrderId, workOrderId))
  }

  async getWorkOrderStages(workOrderId: string): Promise<WorkOrderStage[]> {
    const db = getDb()
    return db
      .select()
      .from(workOrderStages)
      .where(eq(workOrderStages.workOrderId, workOrderId))
      .orderBy(workOrderStages.sortOrder)
  }

  async getWorkOrderNotes(workOrderId: string): Promise<typeof workOrderNotes.$inferSelect[]> {
    const db = getDb()
    return db
      .select()
      .from(workOrderNotes)
      .where(eq(workOrderNotes.workOrderId, workOrderId))
      .orderBy(desc(workOrderNotes.createdAt))
  }

  async createWorkOrder(data: CreateWorkOrderData): Promise<WorkOrder> {
    const db = getDb()
    const sqlite = getSqlite()

    const orderNo = await this.generateOrderNo()
    const id = newId()
    const now = new Date()

    sqlite.transaction(() => {
      // Insert work order
      sqlite
        .prepare(
          `INSERT INTO work_orders (id, order_no, customer_id, category, order_type, status, priority,
          due_date, total_amount, discount_amount, discount_reason, coupon_id, tax_amount, paid_amount,
          vendor_cost_total, profit_amount, notes, customer_approval_required, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'New', ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          orderNo,
          data.customerId,
          data.category,
          data.orderType,
          data.priority,
          data.dueDate ?? null,
          data.totalAmount,
          data.discountAmount ?? 0,
          data.discountReason ?? null,
          data.couponId ?? null,
          data.taxAmount ?? 0,
          data.vendorCostTotal ?? 0,
          data.notes ?? null,
          data.customerApprovalRequired ? 1 : 0,
          data.createdBy ?? null,
          now.getTime(),
          now.getTime()
        )

      // Insert items
      for (const item of data.items) {
        sqlite
          .prepare(
            `INSERT INTO work_order_items (id, work_order_id, product_id, custom_description, qty, unit_price,
            customization_notes, measurement_id, fabric_id, fabric_qty, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            newId(),
            id,
            item.productId ?? null,
            item.customDescription ?? null,
            item.qty,
            item.unitPrice,
            item.customizationNotes ?? null,
            item.measurementId ?? null,
            item.fabricId ?? null,
            item.fabricQty ?? null,
            now.getTime()
          )

        // Deduct fabric stock if specified
        if (item.fabricId && item.fabricQty) {
          sqlite
            .prepare(
              `INSERT INTO fabric_movements (id, fabric_id, type, qty_change, reference_id, note, created_at)
              VALUES (?, ?, 'CONSUMPTION', ?, ?, 'Work order consumption', ?)`
            )
            .run(newId(), item.fabricId, -Math.abs(item.fabricQty), id, now.getTime())

          sqlite
            .prepare(`UPDATE fabrics SET stock_qty = stock_qty - ?, updated_at = ? WHERE id = ?`)
            .run(Math.abs(item.fabricQty), now.getTime(), item.fabricId)
        }

        // Reserve product stock
        if (item.productId) {
          sqlite
            .prepare(`UPDATE products SET reserved_qty = reserved_qty + ?, updated_at = ? WHERE id = ?`)
            .run(item.qty, now.getTime(), item.productId)

          sqlite
            .prepare(
              `INSERT INTO stock_movements (id, product_id, type, qty_change, reference_type, reference_id, note, created_by, created_at)
              VALUES (?, ?, 'RESERVED', ?, 'WORK_ORDER', ?, 'Reserved for work order', ?, ?)`
            )
            .run(newId(), item.productId, item.qty, id, data.createdBy ?? null, now.getTime())
        }
      }

      // Insert stages
      for (const stage of data.stages) {
        sqlite
          .prepare(
            `INSERT INTO work_order_stages (id, work_order_id, stage_name, sort_order, status, vendor_id,
            service_tier, vendor_cost, scheduled_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?)`
          )
          .run(
            newId(),
            id,
            stage.stageName,
            stage.sortOrder,
            stage.vendorId ?? null,
            stage.serviceTier ?? null,
            stage.vendorCost ?? 0,
            stage.scheduledDate ?? null,
            now.getTime(),
            now.getTime()
          )

        // Create vendor payment obligation
        if (stage.vendorId && stage.vendorCost) {
          sqlite
            .prepare(
              `INSERT INTO vendor_payments (id, vendor_id, work_order_id, service_type, amount, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`
            )
            .run(newId(), stage.vendorId, id, stage.stageName, stage.vendorCost, now.getTime(), now.getTime())
        }
      }

      // Record advance payment
      if (data.advancePayment && data.advancePayment.amount > 0) {
        sqlite
          .prepare(
            `INSERT INTO payments (id, work_order_id, amount, payment_type, method, reference_no, received_by, created_at)
            VALUES (?, ?, ?, 'ADVANCE', ?, ?, ?, ?)`
          )
          .run(
            newId(),
            id,
            data.advancePayment.amount,
            data.advancePayment.method,
            data.advancePayment.referenceNo ?? null,
            data.createdBy ?? null,
            now.getTime()
          )

        // Update paid amount
        sqlite
          .prepare(`UPDATE work_orders SET paid_amount = ?, updated_at = ? WHERE id = ?`)
          .run(data.advancePayment.amount, now.getTime(), id)
      }

      // Update coupon usage
      if (data.couponId) {
        sqlite.prepare(`UPDATE coupons SET used_count = used_count + 1, updated_at = ? WHERE id = ?`).run(now.getTime(), data.couponId)
      }
    })()

    this.auditLog({ userId: data.createdBy, action: 'CREATE', entityType: 'work_order', entityId: id })
    const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, id))
    return wo
  }

  async updateStatus(id: string, status: string, userId?: string): Promise<void> {
    const db = getDb()
    const now = new Date()
    await db.update(workOrders).set({ status, updatedAt: now } as any).where(eq(workOrders.id, id))

    // Add to notes timeline
    await db.insert(workOrderNotes).values({
      id: newId(),
      workOrderId: id,
      note: `Status changed to: ${status}`,
      isInternal: true,
      createdBy: userId,
      createdAt: now
    })

    this.auditLog({ userId, action: 'STATUS_CHANGE', entityType: 'work_order', entityId: id, newValue: { status } })
  }

  async updateStageStatus(
    stageId: string,
    status: string,
    opts?: { qcPassed?: boolean; qcNotes?: string; userId?: string }
  ): Promise<void> {
    const db = getDb()
    const now = new Date()
    await db
      .update(workOrderStages)
      .set({
        status,
        qualityPassed: opts?.qcPassed,
        qcNotes: opts?.qcNotes,
        ...(status === 'In Progress' ? { startedAt: now } : {}),
        ...(status === 'Completed' || status === 'Failed QC' ? { completedAt: now } : {}),
        updatedAt: now
      } as any)
      .where(eq(workOrderStages.id, stageId))
  }

  async addNote(workOrderId: string, note: string, isInternal: boolean, userId?: string): Promise<void> {
    const db = getDb()
    await db.insert(workOrderNotes).values({
      id: newId(),
      workOrderId,
      note,
      isInternal,
      createdBy: userId,
      createdAt: new Date()
    })
  }

  async cancelWorkOrder(id: string, reason: string, userId?: string): Promise<void> {
    const db = getDb()
    const sqlite = getSqlite()
    const now = new Date()

    sqlite.transaction(() => {
      sqlite.prepare(`UPDATE work_orders SET status = 'Cancelled', updated_at = ? WHERE id = ?`).run(now.getTime(), id)

      // Release reserved stock
      const items = sqlite.prepare(`SELECT * FROM work_order_items WHERE work_order_id = ?`).all(id) as any[]
      for (const item of items) {
        if (item.product_id) {
          sqlite
            .prepare(`UPDATE products SET reserved_qty = MAX(0, reserved_qty - ?), updated_at = ? WHERE id = ?`)
            .run(item.qty, now.getTime(), item.product_id)
        }
        // Return fabric stock
        if (item.fabric_id && item.fabric_qty) {
          sqlite
            .prepare(`UPDATE fabrics SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?`)
            .run(item.fabric_qty, now.getTime(), item.fabric_id)
        }
      }

      // Add cancellation note
      sqlite
        .prepare(
          `INSERT INTO work_order_notes (id, work_order_id, note, is_internal, created_by, created_at)
          VALUES (?, ?, ?, 1, ?, ?)`
        )
        .run(newId(), id, `Order cancelled. Reason: ${reason}`, userId ?? null, now.getTime())
    })()

    this.auditLog({ userId, action: 'CANCEL', entityType: 'work_order', entityId: id, newValue: { reason } })
  }

  async getOrdersByStatus(): Promise<Record<string, number>> {
    const db = getDb()
    const rows = await db.select().from(workOrders).where(isNull(workOrders.deletedAt))
    const counts: Record<string, number> = {}
    for (const row of rows) {
      counts[row.status] = (counts[row.status] ?? 0) + 1
    }
    return counts
  }

  async getOverdueOrders(): Promise<WorkOrder[]> {
    const db = getDb()
    const today = new Date().toISOString().split('T')[0]
    const rows = await db.select().from(workOrders).where(isNull(workOrders.deletedAt))
    return rows.filter((o) => o.dueDate && o.dueDate < today && !['Delivered', 'Cancelled'].includes(o.status))
  }

  async getUpcomingDeliveries(days: number): Promise<WorkOrder[]> {
    const db = getDb()
    const today = new Date().toISOString().split('T')[0]
    const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const rows = await db.select().from(workOrders).where(isNull(workOrders.deletedAt))
    return rows.filter(
      (o) => o.dueDate && o.dueDate >= today && o.dueDate <= future && !['Delivered', 'Cancelled'].includes(o.status)
    )
  }

  private async generateOrderNo(): Promise<string> {
    const db = getDb()
    const rows = await db.select({ orderNo: workOrders.orderNo }).from(workOrders)
    const prefix = 'FKG'
    const year = new Date().getFullYear()
    const nums = rows
      .map((r) => {
        const parts = r.orderNo.split('-')
        return parseInt(parts[parts.length - 1] ?? '0')
      })
      .filter((n) => !isNaN(n))
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1001
    return `${prefix}-${year}-${String(next).padStart(4, '0')}`
  }
}
