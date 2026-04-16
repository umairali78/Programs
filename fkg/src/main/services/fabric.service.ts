import { eq, desc, and, isNull } from 'drizzle-orm'
import { getDb, getSqlite } from '../db'
import { fabrics, fabricMovements, fabricSuppliers } from '../db/schema'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'
import type { Fabric, NewFabric } from '../db/schema'

export class FabricService extends BaseService {
  async listFabrics(filters?: { search?: string; supplierId?: string; lowStock?: boolean }): Promise<Fabric[]> {
    const db = getDb()
    let rows = await db.select().from(fabrics).where(isNull(fabrics.deletedAt)).orderBy(desc(fabrics.updatedAt))

    if (filters?.search) {
      const s = filters.search.toLowerCase()
      rows = rows.filter(
        (f) => f.name.toLowerCase().includes(s) || (f.color && f.color.toLowerCase().includes(s))
      )
    }
    if (filters?.supplierId) rows = rows.filter((f) => f.supplierId === filters.supplierId)
    if (filters?.lowStock) rows = rows.filter((f) => f.stockQty <= f.lowStockThreshold)
    return rows
  }

  async getFabric(id: string): Promise<Fabric | null> {
    const db = getDb()
    const [row] = await db
      .select()
      .from(fabrics)
      .where(and(eq(fabrics.id, id), isNull(fabrics.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async createFabric(data: Omit<NewFabric, 'id' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<Fabric> {
    const db = getDb()
    const id = newId()
    const now = new Date()
    await db.insert(fabrics).values({ id, ...data, createdAt: now, updatedAt: now })

    if ((data.stockQty ?? 0) > 0) {
      await db.insert(fabricMovements).values({
        id: newId(),
        fabricId: id,
        type: 'PURCHASE',
        qtyChange: data.stockQty ?? 0,
        note: 'Initial stock',
        createdAt: now
      })
    }

    this.auditLog({ userId, action: 'CREATE', entityType: 'fabric', entityId: id, newValue: data })
    const [fabric] = await db.select().from(fabrics).where(eq(fabrics.id, id))
    return fabric
  }

  async updateFabric(id: string, data: Partial<NewFabric>, userId?: string): Promise<void> {
    const db = getDb()
    await db.update(fabrics).set({ ...data, updatedAt: new Date() }).where(eq(fabrics.id, id))
    this.auditLog({ userId, action: 'UPDATE', entityType: 'fabric', entityId: id, newValue: data })
  }

  async deleteFabric(id: string, userId?: string): Promise<void> {
    const db = getDb()
    await db.update(fabrics).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(fabrics.id, id))
    this.auditLog({ userId, action: 'DELETE', entityType: 'fabric', entityId: id })
  }

  async recordMovement(data: {
    fabricId: string
    type: 'PURCHASE' | 'CONSUMPTION' | 'ADJUSTMENT' | 'LOSS'
    qtyChange: number
    referenceId?: string
    note?: string
  }): Promise<void> {
    const sqlite = getSqlite()
    const now = new Date()

    sqlite.transaction(() => {
      sqlite
        .prepare(
          `INSERT INTO fabric_movements (id, fabric_id, type, qty_change, reference_id, note, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(newId(), data.fabricId, data.type, data.qtyChange, data.referenceId ?? null, data.note ?? null, now.getTime())

      if (data.type === 'PURCHASE' || data.type === 'ADJUSTMENT') {
        sqlite
          .prepare(`UPDATE fabrics SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?`)
          .run(data.qtyChange, now.getTime(), data.fabricId)
      } else {
        sqlite
          .prepare(`UPDATE fabrics SET stock_qty = MAX(0, stock_qty - ?), updated_at = ? WHERE id = ?`)
          .run(Math.abs(data.qtyChange), now.getTime(), data.fabricId)
      }
    })()
  }

  async getFabricMovements(fabricId: string): Promise<typeof fabricMovements.$inferSelect[]> {
    const db = getDb()
    return db
      .select()
      .from(fabricMovements)
      .where(eq(fabricMovements.fabricId, fabricId))
      .orderBy(desc(fabricMovements.createdAt))
  }

  async getLowStockFabrics(): Promise<Fabric[]> {
    const db = getDb()
    const all = await db.select().from(fabrics).where(isNull(fabrics.deletedAt))
    return all.filter((f) => f.stockQty <= f.lowStockThreshold)
  }

  // Suppliers
  async listSuppliers(): Promise<typeof fabricSuppliers.$inferSelect[]> {
    const db = getDb()
    return db.select().from(fabricSuppliers).where(isNull(fabricSuppliers.deletedAt))
  }

  async createSupplier(data: {
    name: string
    phone?: string
    address?: string
    notes?: string
  }): Promise<typeof fabricSuppliers.$inferSelect> {
    const db = getDb()
    const id = newId()
    const now = new Date()
    await db.insert(fabricSuppliers).values({ id, ...data, createdAt: now, updatedAt: now })
    const [s] = await db.select().from(fabricSuppliers).where(eq(fabricSuppliers.id, id))
    return s
  }

  async updateSupplier(id: string, data: Partial<{ name: string; phone: string; address: string; notes: string }>): Promise<void> {
    const db = getDb()
    await db.update(fabricSuppliers).set({ ...data, updatedAt: new Date() }).where(eq(fabricSuppliers.id, id))
  }

  async deleteSupplier(id: string): Promise<void> {
    const db = getDb()
    await db.update(fabricSuppliers).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(fabricSuppliers.id, id))
  }
}
