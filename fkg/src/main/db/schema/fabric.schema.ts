import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const fabricSuppliers = sqliteTable('fabric_suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' })
})

export const fabrics = sqliteTable('fabrics', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['Chiffon', 'Silk', 'Cotton', 'Lawn', 'Organza', 'Net', 'Velvet', 'Karhai Fabric', 'Lining', 'Other']
  }).notNull(),
  color: text('color'),
  widthCm: real('width_cm'),
  unit: text('unit', { enum: ['meter', 'yard'] }).notNull().default('meter'),
  costPerUnit: real('cost_per_unit').notNull().default(0),
  stockQty: real('stock_qty').notNull().default(0),
  lowStockThreshold: real('low_stock_threshold').notNull().default(5),
  supplierId: text('supplier_id').references(() => fabricSuppliers.id),
  photoPath: text('photo_path'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' })
})

export const fabricMovements = sqliteTable('fabric_movements', {
  id: text('id').primaryKey(),
  fabricId: text('fabric_id')
    .notNull()
    .references(() => fabrics.id),
  type: text('type', {
    enum: ['PURCHASE', 'CONSUMPTION', 'ADJUSTMENT', 'LOSS']
  }).notNull(),
  qtyChange: real('qty_change').notNull(),
  referenceId: text('reference_id'), // work order id for consumption
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export type Fabric = typeof fabrics.$inferSelect
export type NewFabric = typeof fabrics.$inferInsert
export type FabricSupplier = typeof fabricSuppliers.$inferSelect
export type FabricMovement = typeof fabricMovements.$inferSelect
