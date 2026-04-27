import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  recipientType: text('recipient_type').notNull(),
  recipientId: text('recipient_id').notNull(),
  reportType: text('report_type').notNull(),
  generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull(),
  contentJson: text('content_json'),
  openedAt: integer('opened_at', { mode: 'timestamp' })
})
