import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { users } from './auth.schema'

export const customerTags = sqliteTable('customer_tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6366f1'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  dob: text('dob'), // YYYY-MM-DD
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  loyaltyTier: text('loyalty_tier', {
    enum: ['bronze', 'silver', 'gold', 'vip']
  }).default('bronze'),
  tagsJson: text('tags_json'), // JSON array of tag IDs
  notes: text('notes'),
  photoPath: text('photo_path'),
  referredById: text('referred_by_id'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' })
})

export const customerMeasurements = sqliteTable('customer_measurements', {
  id: text('id').primaryKey(),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id),
  garmentType: text('garment_type').notNull(), // Bridal Dress, Casual Shirt, etc.
  label: text('label'), // optional label for this measurement set
  chest: real('chest'),
  waist: real('waist'),
  hips: real('hips'),
  shoulder: real('shoulder'),
  length: real('length'),
  sleeve: real('sleeve'),
  neck: real('neck'),
  inseam: real('inseam'),
  customJson: text('custom_json'), // additional measurements
  takenBy: text('taken_by').references(() => users.id),
  takenAt: integer('taken_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const customerInteractions = sqliteTable('customer_interactions', {
  id: text('id').primaryKey(),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id),
  type: text('type', {
    enum: ['phone_call', 'walk_in', 'whatsapp', 'sms', 'email', 'other']
  }).notNull(),
  note: text('note'),
  followUpDate: text('follow_up_date'), // YYYY-MM-DD
  followUpDone: integer('follow_up_done', { mode: 'boolean' }).default(false),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
export type CustomerMeasurement = typeof customerMeasurements.$inferSelect
export type CustomerInteraction = typeof customerInteractions.$inferSelect
export type CustomerTag = typeof customerTags.$inferSelect
