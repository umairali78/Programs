import { pgTable, text, timestamp, numeric, integer, boolean, pgEnum, index } from 'drizzle-orm/pg-core'

export const commodityEnum = pgEnum('commodity', [
  'carrageenan_src', 'carrageenan_prc', 'agar_food', 'agar_tech',
  'alginate', 'nori', 'kombu', 'wakame', 'spirulina', 'kelp_meal',
])

export const marketPrices = pgTable('market_prices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  commodity: text('commodity').notNull(),
  priceUsd: numeric('price_usd', { precision: 12, scale: 4 }).notNull(),
  unit: text('unit').notNull(),          // 'per_kg', 'per_mt'
  market: text('market').notNull(),      // 'global_avg', 'asia_pacific', 'europe', 'north_america'
  source: text('source').notNull(),      // 'demo_seed', 'tridge', 'manual'
  weekDate: timestamp('week_date', { mode: 'date' }).notNull(),
  isDemo: boolean('is_demo').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (t) => [index('idx_market_prices_commodity_date').on(t.commodity, t.weekDate)])

export const tradeFlows = pgTable('trade_flows', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  year: integer('year').notNull(),
  reporterIso3: text('reporter_iso3').notNull(),
  partnerIso3: text('partner_iso3').notNull(),
  hsCode: text('hs_code').notNull(),     // '1212.21', '1212.29', '1302.31'
  flowType: text('flow_type').notNull(), // 'export', 'import'
  valueUsd: numeric('value_usd', { precision: 16, scale: 2 }),
  netWeightKg: numeric('net_weight_kg', { precision: 16, scale: 2 }),
  source: text('source').notNull(),
  isDemo: boolean('is_demo').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (t) => [
  index('idx_trade_flows_reporter').on(t.reporterIso3, t.year),
  index('idx_trade_flows_hs').on(t.hsCode, t.year),
])

export const regulatoryFrameworks = pgTable('regulatory_frameworks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  jurisdiction: text('jurisdiction').notNull(), // 'EU', 'USA', 'CODEX', 'WTO', 'JAPAN'
  category: text('category').notNull(),         // 'food_safety', 'import_tariff', 'organic', 'labeling'
  title: text('title').notNull(),
  summary: text('summary'),
  documentUrl: text('document_url'),
  hsCodesCovered: text('hs_codes_covered'),     // JSON array string
  effectiveDate: timestamp('effective_date', { mode: 'date' }),
  expiryDate: timestamp('expiry_date', { mode: 'date' }),
  source: text('source').notNull(),
  isDemo: boolean('is_demo').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
})

export const regulatoryAlerts = pgTable('regulatory_alerts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  frameworkId: text('framework_id'),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  severity: text('severity').notNull(), // 'high', 'medium', 'low', 'info'
  source: text('source').notNull(),
  sourceUrl: text('source_url'),
  jurisdiction: text('jurisdiction').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  emailSent: boolean('email_sent').default(false).notNull(),
  isDemo: boolean('is_demo').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (t) => [index('idx_regulatory_alerts_user').on(t.userId, t.isRead)])

export const apiCache = pgTable('api_cache', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  cacheKey: text('cache_key').notNull().unique(),
  provider: text('provider').notNull(),
  endpoint: text('endpoint').notNull(),
  params: text('params'),
  response: text('response').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (t) => [index('idx_api_cache_key').on(t.cacheKey)])
