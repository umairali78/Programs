import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { schools } from './geo.schema'

export const teachers = sqliteTable('teachers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  schoolId: text('school_id').references(() => schools.id),
  gradeLevels: text('grade_levels'), // JSON array: ["3","4","5"]
  subjects: text('subjects'),         // JSON array
  lat: real('lat'),
  lng: real('lng'),
  zip: text('zip'),
  lastActive: integer('last_active', { mode: 'timestamp' })
})

export const teacherInterests = sqliteTable('teacher_interests', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id')
    .notNull()
    .references(() => teachers.id),
  topic: text('topic').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})
