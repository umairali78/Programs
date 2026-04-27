import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const partnerProspects = sqliteTable('partner_prospects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type'),
  sourceUrl: text('source_url'),
  address: text('address'),
  lat: real('lat'),
  lng: real('lng'),
  county: text('county'),
  aiScore: real('ai_score'),
  status: text('status').notNull().default('new'),
  notes: text('notes'),
  outreachSentAt: integer('outreach_sent_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
})

export const outreachLog = sqliteTable('outreach_log', {
  id: text('id').primaryKey(),
  prospectId: text('prospect_id').notNull().references(() => partnerProspects.id),
  emailSubject: text('email_subject'),
  emailBody: text('email_body'),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  responseStatus: text('response_status')
})
