import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { teachers } from './teacher.schema'
import { programs } from './program.schema'

export const bookmarks = sqliteTable('bookmarks', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id')
    .notNull()
    .references(() => teachers.id),
  programId: text('program_id')
    .notNull()
    .references(() => programs.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const engagements = sqliteTable('engagements', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id')
    .notNull()
    .references(() => teachers.id),
  programId: text('program_id')
    .notNull()
    .references(() => programs.id),
  type: text('type').notNull(), // click | view | bookmark | book | attend
  occurredAt: integer('occurred_at', { mode: 'timestamp' }),
  notes: text('notes')
})

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id')
    .notNull()
    .references(() => teachers.id),
  programId: text('program_id')
    .notNull()
    .references(() => programs.id),
  rating: integer('rating'),
  text: text('text'),
  visitedAt: integer('visited_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const lessonPlans = sqliteTable('lesson_plans', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id')
    .notNull()
    .references(() => teachers.id),
  programId: text('program_id').references(() => programs.id),
  title: text('title').notNull(),
  content: text('content'),
  gradeLevel: text('grade_level'),
  subjects: text('subjects'), // JSON array
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})
