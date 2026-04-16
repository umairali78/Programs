import { eq, isNull, desc, and } from 'drizzle-orm'
import { getDb } from '../db'
import { vendors, vendorServices, vendorAvailability, vendorRatings } from '../db/schema'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'
import type { Vendor, NewVendor, VendorService, VendorRating } from '../db/schema'

export class VendorService extends BaseService {
  async listVendors(filters?: { search?: string; serviceType?: string; isActive?: boolean }): Promise<Vendor[]> {
    const db = getDb()
    let rows = await db.select().from(vendors).where(isNull(vendors.deletedAt))

    if (filters?.isActive !== undefined) {
      rows = rows.filter((v) => v.isActive === filters.isActive)
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase()
      rows = rows.filter((v) => v.name.toLowerCase().includes(s) || (v.phone && v.phone.includes(s)))
    }
    return rows
  }

  async getVendor(id: string): Promise<Vendor | null> {
    const db = getDb()
    const [row] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, id), isNull(vendors.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async createVendor(data: Omit<NewVendor, 'id' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<Vendor> {
    const db = getDb()
    const id = newId()
    const now = new Date()
    await db.insert(vendors).values({ id, ...data, createdAt: now, updatedAt: now })
    this.auditLog({ userId, action: 'CREATE', entityType: 'vendor', entityId: id })
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id))
    return vendor
  }

  async updateVendor(id: string, data: Partial<NewVendor>, userId?: string): Promise<void> {
    const db = getDb()
    await db.update(vendors).set({ ...data, updatedAt: new Date() }).where(eq(vendors.id, id))
    this.auditLog({ userId, action: 'UPDATE', entityType: 'vendor', entityId: id })
  }

  async deleteVendor(id: string, userId?: string): Promise<void> {
    const db = getDb()
    await db.update(vendors).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(vendors.id, id))
  }

  async getVendorServices(vendorId: string): Promise<VendorService[]> {
    const db = getDb()
    return db.select().from(vendorServices).where(eq(vendorServices.vendorId, vendorId))
  }

  async addVendorService(
    data: Omit<typeof vendorServices.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<VendorService> {
    const db = getDb()
    const id = newId()
    const now = new Date()
    await db.insert(vendorServices).values({ id, ...data, createdAt: now, updatedAt: now })
    const [svc] = await db.select().from(vendorServices).where(eq(vendorServices.id, id))
    return svc
  }

  async updateVendorService(id: string, data: Partial<typeof vendorServices.$inferInsert>): Promise<void> {
    const db = getDb()
    await db.update(vendorServices).set({ ...data, updatedAt: new Date() }).where(eq(vendorServices.id, id))
  }

  async deleteVendorService(id: string): Promise<void> {
    const db = getDb()
    await db.delete(vendorServices).where(eq(vendorServices.id, id))
  }

  async getVendorRatings(vendorId: string): Promise<VendorRating[]> {
    const db = getDb()
    return db
      .select()
      .from(vendorRatings)
      .where(eq(vendorRatings.vendorId, vendorId))
      .orderBy(desc(vendorRatings.createdAt))
  }

  async addRating(data: Omit<typeof vendorRatings.$inferInsert, 'id' | 'createdAt'>): Promise<void> {
    const db = getDb()
    await db.insert(vendorRatings).values({ id: newId(), ...data, createdAt: new Date() })

    // Recalculate average
    const ratings = await this.getVendorRatings(data.vendorId)
    const avg =
      ratings.reduce((sum, r) => sum + ((r.qualityScore ?? 0) + (r.timelinessScore ?? 0) + (r.communicationScore ?? 0)) / 3, 0) /
      Math.max(ratings.length, 1)
    await db.update(vendors).set({ ratingAvg: avg, updatedAt: new Date() }).where(eq(vendors.id, data.vendorId))
  }

  async getAvailability(vendorId: string, month: string): Promise<typeof vendorAvailability.$inferSelect[]> {
    const db = getDb()
    const rows = await db.select().from(vendorAvailability).where(eq(vendorAvailability.vendorId, vendorId))
    return rows.filter((r) => r.date.startsWith(month))
  }

  async setAvailability(vendorId: string, date: string, isAvailable: boolean, capacitySlots?: number): Promise<void> {
    const db = getDb()
    const existing = await db
      .select()
      .from(vendorAvailability)
      .where(and(eq(vendorAvailability.vendorId, vendorId), eq(vendorAvailability.date, date)))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(vendorAvailability)
        .set({ isAvailable, capacitySlots: capacitySlots ?? existing[0].capacitySlots })
        .where(eq(vendorAvailability.id, existing[0].id))
    } else {
      await db.insert(vendorAvailability).values({
        id: newId(),
        vendorId,
        date,
        isAvailable,
        capacitySlots: capacitySlots ?? 5,
        bookedSlots: 0,
        createdAt: new Date()
      })
    }
  }

  async compareVendors(vendorIds: string[]): Promise<Record<string, unknown>[]> {
    const db = getDb()
    const result: Record<string, unknown>[] = []

    for (const id of vendorIds) {
      const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1)
      if (!vendor) continue
      const services = await this.getVendorServices(id)
      const ratings = await this.getVendorRatings(id)

      result.push({
        ...vendor,
        services,
        avgQuality: ratings.reduce((s, r) => s + (r.qualityScore ?? 0), 0) / Math.max(ratings.length, 1),
        avgTimeliness: ratings.reduce((s, r) => s + (r.timelinessScore ?? 0), 0) / Math.max(ratings.length, 1),
        totalRatings: ratings.length
      })
    }
    return result
  }
}
