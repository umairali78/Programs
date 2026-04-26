import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const districts = sqliteTable('districts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  county: text('county'),
  superintendentEmail: text('superintendent_email'),
  enrollmentTotal: integer('enrollment_total')
})

export const schools = sqliteTable('schools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  districtId: text('district_id').references(() => districts.id),
  address: text('address'),
  city: text('city'),
  county: text('county'),
  lat: real('lat'),
  lng: real('lng'),
  enrollment: integer('enrollment'),
  title1Flag: integer('title1_flag', { mode: 'boolean' }).default(false),
  geocodingStatus: text('geocoding_status').default('pending')
})
