import { eq, desc, and, isNull } from 'drizzle-orm'
import { getDb } from '../db'
import { staff, staffCommissions, staffAttendance } from '../db/schema'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'

export class StaffService extends BaseService {
  async listStaff(activeOnly = false): Promise<typeof staff.$inferSelect[]> {
    const db = getDb()
    let rows = await db.select().from(staff).where(isNull(staff.deletedAt)).orderBy(staff.name)
    if (activeOnly) rows = rows.filter((s) => s.isActive)
    return rows
  }

  async getStaff(id: string): Promise<typeof staff.$inferSelect | null> {
    const db = getDb()
    const [row] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.id, id), isNull(staff.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async createStaff(
    data: Omit<typeof staff.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>,
    userId?: string
  ): Promise<typeof staff.$inferSelect> {
    const db = getDb()
    const id = newId()
    const now = new Date()
    await db.insert(staff).values({ id, ...data, createdAt: now, updatedAt: now })
    this.auditLog({ userId, action: 'CREATE', entityType: 'staff', entityId: id })
    const [s] = await db.select().from(staff).where(eq(staff.id, id))
    return s
  }

  async updateStaff(id: string, data: Partial<typeof staff.$inferInsert>, userId?: string): Promise<void> {
    const db = getDb()
    await db.update(staff).set({ ...data, updatedAt: new Date() }).where(eq(staff.id, id))
    this.auditLog({ userId, action: 'UPDATE', entityType: 'staff', entityId: id })
  }

  async deleteStaff(id: string, userId?: string): Promise<void> {
    const db = getDb()
    await db.update(staff).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(staff.id, id))
    this.auditLog({ userId, action: 'DELETE', entityType: 'staff', entityId: id })
  }

  // Commissions
  async createCommission(data: Omit<typeof staffCommissions.$inferInsert, 'id' | 'createdAt'>): Promise<typeof staffCommissions.$inferSelect> {
    const db = getDb()
    const id = newId()
    await db.insert(staffCommissions).values({ id, ...data, createdAt: new Date() })
    const [c] = await db.select().from(staffCommissions).where(eq(staffCommissions.id, id))
    return c
  }

  async getCommissions(staffId: string): Promise<typeof staffCommissions.$inferSelect[]> {
    const db = getDb()
    return db
      .select()
      .from(staffCommissions)
      .where(eq(staffCommissions.staffId, staffId))
      .orderBy(desc(staffCommissions.createdAt))
  }

  async markCommissionPaid(id: string, userId?: string): Promise<void> {
    const db = getDb()
    await db
      .update(staffCommissions)
      .set({ status: 'Paid', paidAt: new Date() } as any)
      .where(eq(staffCommissions.id, id))
    this.auditLog({ userId, action: 'COMMISSION_PAID', entityType: 'staff_commission', entityId: id })
  }

  async getPendingCommissions(): Promise<typeof staffCommissions.$inferSelect[]> {
    const db = getDb()
    const all = await db.select().from(staffCommissions)
    return all.filter((c) => c.status === 'Pending')
  }

  async calculateCommission(staffId: string, workOrderId: string, orderAmount: number): Promise<number> {
    const [member] = await getDb().select().from(staff).where(eq(staff.id, staffId)).limit(1)
    if (!member) return 0
    if (member.commissionType === 'NONE') return 0
    if (member.commissionType === 'PERCENT') return (orderAmount * (member.commissionValue ?? 0)) / 100
    return member.commissionValue ?? 0
  }

  // Attendance
  async markAttendance(data: {
    staffId: string
    date: string
    status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY'
    note?: string
  }): Promise<void> {
    const db = getDb()
    const existing = await db
      .select()
      .from(staffAttendance)
      .where(and(eq(staffAttendance.staffId, data.staffId), eq(staffAttendance.date, data.date)))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(staffAttendance)
        .set({ status: data.status, note: data.note ?? null } as any)
        .where(eq(staffAttendance.id, existing[0].id))
    } else {
      await db.insert(staffAttendance).values({
        id: newId(),
        staffId: data.staffId,
        date: data.date,
        status: data.status,
        note: data.note,
        createdAt: new Date()
      })
    }
  }

  async getAttendance(staffId: string, month: string): Promise<typeof staffAttendance.$inferSelect[]> {
    const db = getDb()
    const all = await db.select().from(staffAttendance).where(eq(staffAttendance.staffId, staffId))
    return all.filter((a) => a.date.startsWith(month))
  }

  async getAttendanceSummary(staffId: string, month: string): Promise<Record<string, number>> {
    const records = await this.getAttendance(staffId, month)
    const summary: Record<string, number> = { PRESENT: 0, ABSENT: 0, LEAVE: 0, HALF_DAY: 0 }
    for (const r of records) {
      summary[r.status] = (summary[r.status] ?? 0) + 1
    }
    return summary
  }
}
