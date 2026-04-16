import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { users } from './auth.schema'

export const vendors = sqliteTable('vendors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  address: text('address'),
  city: text('city'),
  cnic: text('cnic'), // encrypted
  specialtyTagsJson: text('specialty_tags_json'), // JSON array
  ratingAvg: real('rating_avg').default(0),
  totalPaid: real('total_paid').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' })
})

export const vendorServices = sqliteTable('vendor_services', {
  id: text('id').primaryKey(),
  vendorId: text('vendor_id')
    .notNull()
    .references(() => vendors.id),
  serviceType: text('service_type').notNull(),
  priceEconomy: real('price_economy'),
  priceStandard: real('price_standard'),
  pricePremium: real('price_premium'),
  turnaroundDaysMin: integer('turnaround_days_min'),
  turnaroundDaysMax: integer('turnaround_days_max'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const vendorAvailability = sqliteTable('vendor_availability', {
  id: text('id').primaryKey(),
  vendorId: text('vendor_id')
    .notNull()
    .references(() => vendors.id),
  date: text('date').notNull(), // YYYY-MM-DD
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
  capacitySlots: integer('capacity_slots').default(5),
  bookedSlots: integer('booked_slots').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const vendorRatings = sqliteTable('vendor_ratings', {
  id: text('id').primaryKey(),
  vendorId: text('vendor_id')
    .notNull()
    .references(() => vendors.id),
  workOrderId: text('work_order_id'),
  qualityScore: integer('quality_score'), // 1-5
  timelinessScore: integer('timeliness_score'), // 1-5
  communicationScore: integer('communication_score'), // 1-5
  note: text('note'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export type Vendor = typeof vendors.$inferSelect
export type NewVendor = typeof vendors.$inferInsert
export type VendorService = typeof vendorServices.$inferSelect
export type VendorRating = typeof vendorRatings.$inferSelect
