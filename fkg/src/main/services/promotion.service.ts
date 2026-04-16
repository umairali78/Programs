import { eq, desc, and, isNull } from 'drizzle-orm'
import { getDb } from '../db'
import { coupons, promotions } from '../db/schema'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'

export class PromotionService extends BaseService {
  async listCoupons(activeOnly = false): Promise<typeof coupons.$inferSelect[]> {
    const db = getDb()
    let rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt))
    if (activeOnly) rows = rows.filter((c) => c.isActive)
    return rows
  }

  async getCoupon(id: string): Promise<typeof coupons.$inferSelect | null> {
    const db = getDb()
    const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1)
    return row ?? null
  }

  async getCouponByCode(code: string): Promise<typeof coupons.$inferSelect | null> {
    const db = getDb()
    const [row] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1)
    return row ?? null
  }

  async validateCoupon(
    code: string,
    orderAmount: number
  ): Promise<{ valid: boolean; discount: number; coupon?: typeof coupons.$inferSelect; reason?: string }> {
    const coupon = await this.getCouponByCode(code)
    if (!coupon) return { valid: false, discount: 0, reason: 'Coupon not found' }
    if (!coupon.isActive) return { valid: false, discount: 0, reason: 'Coupon is inactive' }

    const now = new Date().toISOString().split('T')[0]
    if (coupon.validFrom && now < coupon.validFrom) return { valid: false, discount: 0, reason: 'Coupon not yet valid' }
    if (coupon.validTo && now > coupon.validTo) return { valid: false, discount: 0, reason: 'Coupon has expired' }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, discount: 0, reason: 'Coupon usage limit reached' }
    if (coupon.minOrderValue && orderAmount < coupon.minOrderValue) {
      return { valid: false, discount: 0, reason: `Minimum order value is ${coupon.minOrderValue}` }
    }

    let discount = 0
    if (coupon.type === 'PERCENT') {
      discount = (orderAmount * coupon.value) / 100
    } else {
      discount = Math.min(coupon.value, orderAmount)
    }

    return { valid: true, discount: Math.round(discount * 100) / 100, coupon }
  }

  async createCoupon(
    data: Omit<typeof coupons.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'usedCount'>,
    userId?: string
  ): Promise<typeof coupons.$inferSelect> {
    const db = getDb()
    const id = newId()
    const now = new Date()
    await db.insert(coupons).values({ id, ...data, code: data.code.toUpperCase(), usedCount: 0, createdAt: now, updatedAt: now })
    this.auditLog({ userId, action: 'CREATE', entityType: 'coupon', entityId: id })
    const [c] = await db.select().from(coupons).where(eq(coupons.id, id))
    return c
  }

  async updateCoupon(id: string, data: Partial<typeof coupons.$inferInsert>, userId?: string): Promise<void> {
    const db = getDb()
    await db.update(coupons).set({ ...data, updatedAt: new Date() }).where(eq(coupons.id, id))
    this.auditLog({ userId, action: 'UPDATE', entityType: 'coupon', entityId: id })
  }

  async deleteCoupon(id: string, userId?: string): Promise<void> {
    const db = getDb()
    await db.delete(coupons).where(eq(coupons.id, id))
    this.auditLog({ userId, action: 'DELETE', entityType: 'coupon', entityId: id })
  }

  async listPromotions(activeOnly = false): Promise<typeof promotions.$inferSelect[]> {
    const db = getDb()
    let rows = await db.select().from(promotions).orderBy(desc(promotions.createdAt))
    if (activeOnly) rows = rows.filter((p) => p.isActive)
    return rows
  }

  async createPromotion(
    data: Omit<typeof promotions.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>,
    userId?: string
  ): Promise<typeof promotions.$inferSelect> {
    const db = getDb()
    const id = newId()
    const now = new Date()
    await db.insert(promotions).values({ id, ...data, createdAt: now, updatedAt: now })
    this.auditLog({ userId, action: 'CREATE', entityType: 'promotion', entityId: id })
    const [p] = await db.select().from(promotions).where(eq(promotions.id, id))
    return p
  }

  async updatePromotion(id: string, data: Partial<typeof promotions.$inferInsert>, userId?: string): Promise<void> {
    const db = getDb()
    await db.update(promotions).set({ ...data, updatedAt: new Date() }).where(eq(promotions.id, id))
    this.auditLog({ userId, action: 'UPDATE', entityType: 'promotion', entityId: id })
  }

  async deletePromotion(id: string, userId?: string): Promise<void> {
    const db = getDb()
    await db.delete(promotions).where(eq(promotions.id, id))
    this.auditLog({ userId, action: 'DELETE', entityType: 'promotion', entityId: id })
  }
}
