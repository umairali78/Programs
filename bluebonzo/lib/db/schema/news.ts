import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const marketNews = pgTable('market_news', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  url: text('url'),
  source: text('source').notNull(),
  category: text('category').notNull(), // 'trade', 'research', 'regulation', 'investment', 'sustainability'
  sentiment: text('sentiment'),         // 'positive', 'neutral', 'negative'
  isDemo: boolean('is_demo').default(false).notNull(),
  publishedAt: timestamp('published_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const companies = pgTable('companies', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  country: text('country').notNull(),
  countryIso3: text('country_iso3'),
  sector: text('sector').notNull(),    // 'farming', 'processing', 'trading', 'biotech', 'retail'
  species: text('species'),            // JSON string[]
  description: text('description'),
  website: text('website'),
  employeeRange: text('employee_range'),
  revenueRange: text('revenue_range'),
  certifications: text('certifications'), // JSON string[]
  isDemo: boolean('is_demo').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})
