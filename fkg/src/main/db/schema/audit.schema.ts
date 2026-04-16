import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { users } from './auth.schema'

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  userName: text('user_name'),
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  oldValueJson: text('old_value_json'),
  newValueJson: text('new_value_json'),
  ip: text('ip'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
