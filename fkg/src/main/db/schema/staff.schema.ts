import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { workOrders } from './workorder.schema'

export const staff = sqliteTable('staff', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  role: text('role').notNull().default('staff'),
  commissionType: text('commission_type', { enum: ['NONE', 'PERCENT', 'FIXED'] })
    .notNull()
    .default('NONE'),
  commissionValue: real('commission_value').default(0),
  joiningDate: text('joining_date'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' })
})

export const staffCommissions = sqliteTable('staff_commissions', {
  id: text('id').primaryKey(),
  staffId: text('staff_id')
    .notNull()
    .references(() => staff.id),
  workOrderId: text('work_order_id').references(() => workOrders.id),
  amount: real('amount').notNull(),
  status: text('status', { enum: ['Pending', 'Paid'] }).notNull().default('Pending'),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const staffAttendance = sqliteTable('staff_attendance', {
  id: text('id').primaryKey(),
  staffId: text('staff_id')
    .notNull()
    .references(() => staff.id),
  date: text('date').notNull(), // YYYY-MM-DD
  status: text('status', { enum: ['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY'] }).notNull(),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export type Staff = typeof staff.$inferSelect
export type NewStaff = typeof staff.$inferInsert
export type StaffCommission = typeof staffCommissions.$inferSelect
export type StaffAttendance = typeof staffAttendance.$inferSelect
