import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { partners } from './partner.schema'

export const programs = sqliteTable('programs', {
  id: text('id').primaryKey(),
  partnerId: text('partner_id')
    .notNull()
    .references(() => partners.id),
  title: text('title').notNull(),
  description: text('description'),
  gradeLevels: text('grade_levels'),  // JSON array: ["TK","K","1","2","3","4","5"]
  subjects: text('subjects'),          // JSON array
  maxStudents: integer('max_students'),
  durationMins: integer('duration_mins'),
  cost: real('cost').default(0),
  season: text('season'),              // JSON array: ["Spring","Fall"]
  lat: real('lat'),
  lng: real('lng'),
  createdAt: integer('created_at', { mode: 'timestamp' })
})

export const programStandards = sqliteTable('program_standards', {
  id: text('id').primaryKey(),
  programId: text('program_id')
    .notNull()
    .references(() => programs.id),
  standardCode: text('standard_code').notNull(),
  standardDesc: text('standard_desc'),
  framework: text('framework') // NGSS | EP&Cs
})
