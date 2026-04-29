import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core'

export const partners = sqliteTable('partners', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('general'),
  description: text('description'),
  address: text('address'),
  city: text('city'),
  phone: text('phone'),
  topics: text('topics'),
  lat: real('lat'),
  lng: real('lng'),
  county: text('county'),
  contactEmail: text('contact_email'),
  website: text('website'),
  status: text('status').notNull().default('active'),
  profileScore: real('profile_score').default(0),
  geocodingStatus: text('geocoding_status').default('pending')
})
