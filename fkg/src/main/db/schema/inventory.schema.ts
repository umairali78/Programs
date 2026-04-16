import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { users } from './auth.schema'

export const productCategories = sqliteTable('product_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  parentId: text('parent_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' })
})

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => productCategories.id),
  fabricId: text('fabric_id'),
  colorPrimary: text('color_primary'),
  colorSecondary: text('color_secondary'),
  sizeType: text('size_type', {
    enum: ['standard', 'custom', 'one_size']
  }).default('standard'),
  costPrice: real('cost_price').notNull().default(0),
  sellPrice: real('sell_price').notNull().default(0),
  wholesalePrice: real('wholesale_price'),
  rentalPrice: real('rental_price'),
  stockQty: integer('stock_qty').notNull().default(0),
  reservedQty: integer('reserved_qty').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  reorderQty: integer('reorder_qty').default(10),
  barcode: text('barcode'),
  description: text('description'),
  designNotes: text('design_notes'),
  embellishmentTags: text('embellishment_tags'), // JSON array
  seasonTag: text('season_tag'),
  collectionName: text('collection_name'),
  storageLocation: text('storage_location'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  status: text('status', {
    enum: ['active', 'inactive', 'discontinued']
  }).default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' })
})

export const productImages = sqliteTable('product_images', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  imagePath: text('image_path').notNull(),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const productSizeCharts = sqliteTable('product_size_charts', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  sizeLabel: text('size_label').notNull(),
  chest: real('chest'),
  waist: real('waist'),
  hips: real('hips'),
  length: real('length'),
  sleeve: real('sleeve'),
  neck: real('neck'),
  customJson: text('custom_json'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const stockMovements = sqliteTable('stock_movements', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  type: text('type', {
    enum: ['IN', 'OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED']
  }).notNull(),
  qtyChange: integer('qty_change').notNull(),
  referenceType: text('reference_type'), // WORK_ORDER, PURCHASE, MANUAL, etc.
  referenceId: text('reference_id'),
  note: text('note'),
  reason: text('reason'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type ProductCategory = typeof productCategories.$inferSelect
export type StockMovement = typeof stockMovements.$inferSelect
