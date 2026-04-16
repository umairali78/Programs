import { eq, and } from 'drizzle-orm'
import { getDb, getSqlite } from '../db'
import { notifications, workOrders, products, fabrics, installments } from '../db/schema'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'

export class NotificationService extends BaseService {
  private pushCallback?: (notification: typeof notifications.$inferSelect) => void

  onPush(cb: (n: typeof notifications.$inferSelect) => void) {
    this.pushCallback = cb
  }

  private async push(data: {
    userId?: string
    type: string
    title: string
    body: string
    entityType?: string
    entityId?: string
  }): Promise<void> {
    const db = getDb()
    const sqlite = getSqlite()

    // Dedup: check if same type+entity was notified in last 24h
    if (data.entityId) {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      const existing = sqlite
        .prepare(`SELECT id FROM notifications WHERE type = ? AND entity_id = ? AND created_at > ?`)
        .all(data.type, data.entityId, cutoff) as any[]
      if (existing.length > 0) return
    }

    const id = newId()
    await db.insert(notifications).values({
      id,
      userId: data.userId ?? null,
      type: data.type as any,
      title: data.title,
      body: data.body,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      isRead: false,
      createdAt: new Date()
    })

    const [n] = await db.select().from(notifications).where(eq(notifications.id, id))
    this.pushCallback?.(n)
  }

  async runChecks(): Promise<void> {
    await Promise.all([
      this.checkOverdueOrders(),
      this.checkUpcomingDeadlines(),
      this.checkLowStock(),
      this.checkLowFabricStock(),
      this.checkOverdueInstallments()
    ])
  }

  private async checkOverdueOrders(): Promise<void> {
    const db = getDb()
    const today = new Date().toISOString().split('T')[0]
    const all = await db.select().from(workOrders)
    const overdue = all.filter(
      (o) => o.dueDate && o.dueDate < today && !['Delivered', 'Cancelled'].includes(o.status) && !o.deletedAt
    )
    for (const o of overdue) {
      await this.push({
        type: 'ORDER_OVERDUE',
        title: 'Order Overdue',
        body: `Order ${o.orderNo} was due on ${o.dueDate}`,
        entityType: 'work_order',
        entityId: o.id
      })
    }
  }

  private async checkUpcomingDeadlines(): Promise<void> {
    const db = getDb()
    const today = new Date().toISOString().split('T')[0]
    const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]
    const all = await db.select().from(workOrders)
    const upcoming = all.filter(
      (o) =>
        o.dueDate &&
        o.dueDate >= today &&
        o.dueDate <= in48h &&
        !['Delivered', 'Cancelled'].includes(o.status) &&
        !o.deletedAt
    )
    for (const o of upcoming) {
      await this.push({
        type: 'DEADLINE_APPROACHING',
        title: 'Deadline Approaching',
        body: `Order ${o.orderNo} is due on ${o.dueDate}`,
        entityType: 'work_order',
        entityId: o.id
      })
    }
  }

  private async checkLowStock(): Promise<void> {
    const db = getDb()
    const all = await db.select().from(products)
    const low = all.filter((p) => !p.deletedAt && p.stockQty - p.reservedQty <= p.lowStockThreshold && p.status !== 'discontinued')
    for (const p of low) {
      await this.push({
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        body: `${p.name} (SKU: ${p.sku}) has only ${p.stockQty - p.reservedQty} units available`,
        entityType: 'product',
        entityId: p.id
      })
    }
  }

  private async checkLowFabricStock(): Promise<void> {
    const db = getDb()
    const all = await db.select().from(fabrics)
    const low = all.filter((f) => !f.deletedAt && f.stockQty <= f.lowStockThreshold)
    for (const f of low) {
      await this.push({
        type: 'LOW_FABRIC_STOCK',
        title: 'Low Fabric Stock',
        body: `${f.name} has only ${f.stockQty} ${f.unit} remaining`,
        entityType: 'fabric',
        entityId: f.id
      })
    }
  }

  private async checkOverdueInstallments(): Promise<void> {
    const db = getDb()
    const today = new Date().toISOString().split('T')[0]
    const all = await db.select().from(installments)
    const overdue = all.filter((i) => i.status === 'Pending' && i.dueDate < today)
    for (const i of overdue) {
      await this.push({
        type: 'INSTALLMENT_OVERDUE',
        title: 'Installment Overdue',
        body: `Installment of PKR ${i.amount} was due on ${i.dueDate}`,
        entityType: 'installment',
        entityId: i.id
      })
    }
  }

  async listNotifications(userId?: string, unreadOnly = false): Promise<typeof notifications.$inferSelect[]> {
    const db = getDb()
    let rows = await db
      .select()
      .from(notifications)
      .orderBy(notifications.createdAt)

    if (userId) rows = rows.filter((n) => !n.userId || n.userId === userId)
    if (unreadOnly) rows = rows.filter((n) => !n.isRead)
    return rows.reverse()
  }

  async markRead(id: string): Promise<void> {
    const db = getDb()
    await db.update(notifications).set({ isRead: true } as any).where(eq(notifications.id, id))
  }

  async markAllRead(userId?: string): Promise<void> {
    const db = getDb()
    const sqlite = getSqlite()
    if (userId) {
      sqlite.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL`).run(userId)
    } else {
      sqlite.prepare(`UPDATE notifications SET is_read = 1`).run()
    }
  }

  async getUnreadCount(userId?: string): Promise<number> {
    const rows = await this.listNotifications(userId, true)
    return rows.length
  }
}
