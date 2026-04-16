import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { users } from './auth.schema'

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id), // null = all users
  type: text('type', {
    enum: [
      'LOW_STOCK',
      'ORDER_OVERDUE',
      'DEADLINE_APPROACHING',
      'PAYMENT_DUE',
      'VENDOR_PAYMENT_DUE',
      'CUSTOMER_FOLLOWUP',
      'CUSTOMER_BIRTHDAY',
      'QC_FAILED',
      'STAGE_COMPLETED',
      'INSTALLMENT_OVERDUE'
    ]
  }).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type Setting = typeof settings.$inferSelect
