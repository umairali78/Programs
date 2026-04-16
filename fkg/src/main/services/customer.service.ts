import { eq, isNull, desc, and } from 'drizzle-orm'
import { getDb } from '../db'
import { customers, customerMeasurements, customerInteractions, customerTags } from '../db/schema'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'
import type { Customer, NewCustomer, CustomerMeasurement } from '../db/schema'

export class CustomerService extends BaseService {
  async listCustomers(filters?: { search?: string; tier?: string; dormantDays?: number }): Promise<Customer[]> {
    const db = getDb()
    let rows = await db.select().from(customers).where(isNull(customers.deletedAt)).orderBy(desc(customers.updatedAt))

    if (filters?.search) {
      const s = filters.search.toLowerCase()
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          (c.phone && c.phone.includes(s)) ||
          (c.email && c.email.toLowerCase().includes(s))
      )
    }
    if (filters?.tier) {
      rows = rows.filter((c) => c.loyaltyTier === filters.tier)
    }
    return rows
  }

  async getCustomer(id: string): Promise<Customer | null> {
    const db = getDb()
    const [row] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async createCustomer(data: Omit<NewCustomer, 'id' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<Customer> {
    const db = getDb()
    const id = newId()
    const now = new Date()
    await db.insert(customers).values({ id, ...data, createdAt: now, updatedAt: now })
    this.auditLog({ userId, action: 'CREATE', entityType: 'customer', entityId: id })
    const [customer] = await db.select().from(customers).where(eq(customers.id, id))
    return customer
  }

  async updateCustomer(id: string, data: Partial<NewCustomer>, userId?: string): Promise<void> {
    const db = getDb()
    await db.update(customers).set({ ...data, updatedAt: new Date() }).where(eq(customers.id, id))
    this.auditLog({ userId, action: 'UPDATE', entityType: 'customer', entityId: id })
  }

  async deleteCustomer(id: string, userId?: string): Promise<void> {
    const db = getDb()
    await db.update(customers).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(customers.id, id))
    this.auditLog({ userId, action: 'DELETE', entityType: 'customer', entityId: id })
  }

  async getMeasurements(customerId: string): Promise<CustomerMeasurement[]> {
    const db = getDb()
    return db
      .select()
      .from(customerMeasurements)
      .where(eq(customerMeasurements.customerId, customerId))
      .orderBy(desc(customerMeasurements.createdAt))
  }

  async saveMeasurement(
    data: Omit<typeof customerMeasurements.$inferInsert, 'id' | 'createdAt' | 'takenAt'>
  ): Promise<CustomerMeasurement> {
    const db = getDb()
    const id = newId()
    const now = new Date()
    await db.insert(customerMeasurements).values({ id, ...data, takenAt: now, createdAt: now })
    const [m] = await db.select().from(customerMeasurements).where(eq(customerMeasurements.id, id))
    return m
  }

  async addInteraction(data: Omit<typeof customerInteractions.$inferInsert, 'id' | 'createdAt'>): Promise<void> {
    const db = getDb()
    await db.insert(customerInteractions).values({ id: newId(), ...data, createdAt: new Date() })
  }

  async getInteractions(customerId: string): Promise<typeof customerInteractions.$inferSelect[]> {
    const db = getDb()
    return db
      .select()
      .from(customerInteractions)
      .where(eq(customerInteractions.customerId, customerId))
      .orderBy(desc(customerInteractions.createdAt))
  }

  async addLoyaltyPoints(customerId: string, points: number): Promise<void> {
    const db = getDb()
    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId))
    if (!customer) return

    const newPoints = customer.loyaltyPoints + points
    let tier = customer.loyaltyTier ?? 'bronze'
    if (newPoints >= 5000) tier = 'vip'
    else if (newPoints >= 2000) tier = 'gold'
    else if (newPoints >= 500) tier = 'silver'
    else tier = 'bronze'

    await db
      .update(customers)
      .set({ loyaltyPoints: newPoints, loyaltyTier: tier, updatedAt: new Date() })
      .where(eq(customers.id, customerId))
  }

  async redeemLoyaltyPoints(customerId: string, points: number): Promise<void> {
    const db = getDb()
    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId))
    if (!customer) return
    const newPoints = Math.max(0, customer.loyaltyPoints - points)
    await db.update(customers).set({ loyaltyPoints: newPoints, updatedAt: new Date() }).where(eq(customers.id, customerId))
  }

  async getUpcomingBirthdays(days: number): Promise<Customer[]> {
    const db = getDb()
    const all = await db.select().from(customers).where(isNull(customers.deletedAt))
    const today = new Date()
    return all.filter((c) => {
      if (!c.dob) return false
      const dob = new Date(c.dob)
      const upcoming = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
      if (upcoming < today) upcoming.setFullYear(today.getFullYear() + 1)
      const diff = (upcoming.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      return diff <= days
    })
  }

  async getPendingFollowups(): Promise<typeof customerInteractions.$inferSelect[]> {
    const db = getDb()
    const today = new Date().toISOString().split('T')[0]
    const all = await db.select().from(customerInteractions)
    return all.filter((i) => i.followUpDate && i.followUpDate <= today && !i.followUpDone)
  }

  async listTags(): Promise<typeof customerTags.$inferSelect[]> {
    const db = getDb()
    return db.select().from(customerTags)
  }

  async createTag(name: string, color: string): Promise<typeof customerTags.$inferSelect> {
    const db = getDb()
    const id = newId()
    await db.insert(customerTags).values({ id, name, color, createdAt: new Date() })
    const [tag] = await db.select().from(customerTags).where(eq(customerTags.id, id))
    return tag
  }
}
