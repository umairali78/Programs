import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const coupons = sqliteTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  type: text('type', { enum: ['PERCENT', 'FIXED'] }).notNull(),
  value: real('value').notNull(),
  minOrderValue: real('min_order_value').default(0),
  maxUses: integer('max_uses').default(0), // 0 = unlimited
  usedCount: integer('used_count').notNull().default(0),
  validFrom: text('valid_from'), // YYYY-MM-DD
  validTo: text('valid_to'), // YYYY-MM-DD
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const promotions = sqliteTable('promotions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['Order Discount', 'Buy X Get Y', 'Category Discount', 'Loyalty Tier Discount']
  }).notNull(),
  discountValue: real('discount_value').notNull(),
  appliesTo: text('applies_to'),
  conditionsJson: text('conditions_json'),
  validFrom: text('valid_from'),
  validTo: text('valid_to'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export type Coupon = typeof coupons.$inferSelect
export type NewCoupon = typeof coupons.$inferInsert
export type Promotion = typeof promotions.$inferSelect
