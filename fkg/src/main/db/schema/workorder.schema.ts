import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { users } from './auth.schema'
import { customers } from './customer.schema'
import { vendors } from './vendor.schema'
import { products } from './inventory.schema'
import { fabrics } from './fabric.schema'
import { customerMeasurements } from './customer.schema'
import { coupons } from './promotion.schema'

export const workOrders = sqliteTable('work_orders', {
  id: text('id').primaryKey(),
  orderNo: text('order_no').notNull().unique(),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id),
  category: text('category', {
    enum: ['Bridal', 'Formal', 'Casual', 'Traditional', 'Other']
  }).notNull(),
  orderType: text('order_type', {
    enum: ['NEW', 'ALTERATION', 'REPAIR', 'RENTAL']
  })
    .notNull()
    .default('NEW'),
  status: text('status', {
    enum: [
      'New',
      'Measurement Taken',
      'In Production',
      'Quality Check',
      'Awaiting Customer',
      'Ready',
      'Delivered',
      'Cancelled',
      'On Hold'
    ]
  })
    .notNull()
    .default('New'),
  priority: text('priority', { enum: ['Urgent', 'Normal', 'Flexible'] })
    .notNull()
    .default('Normal'),
  dueDate: text('due_date'), // YYYY-MM-DD
  totalAmount: real('total_amount').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  discountReason: text('discount_reason'),
  couponId: text('coupon_id').references(() => coupons.id),
  taxAmount: real('tax_amount').notNull().default(0),
  paidAmount: real('paid_amount').notNull().default(0),
  vendorCostTotal: real('vendor_cost_total').notNull().default(0),
  profitAmount: real('profit_amount').notNull().default(0),
  notes: text('notes'),
  holdReason: text('hold_reason'),
  holdResumeDate: text('hold_resume_date'),
  customerApprovalRequired: integer('customer_approval_required', { mode: 'boolean' }).default(false),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' })
})

export const workOrderItems = sqliteTable('work_order_items', {
  id: text('id').primaryKey(),
  workOrderId: text('work_order_id')
    .notNull()
    .references(() => workOrders.id),
  productId: text('product_id').references(() => products.id),
  customDescription: text('custom_description'),
  qty: integer('qty').notNull().default(1),
  unitPrice: real('unit_price').notNull().default(0),
  customizationNotes: text('customization_notes'),
  measurementId: text('measurement_id').references(() => customerMeasurements.id),
  fabricId: text('fabric_id').references(() => fabrics.id),
  fabricQty: real('fabric_qty'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const workOrderStages = sqliteTable('work_order_stages', {
  id: text('id').primaryKey(),
  workOrderId: text('work_order_id')
    .notNull()
    .references(() => workOrders.id),
  stageName: text('stage_name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', {
    enum: ['Pending', 'In Progress', 'Completed', 'Failed QC', 'Blocked']
  })
    .notNull()
    .default('Pending'),
  vendorId: text('vendor_id').references(() => vendors.id),
  serviceTier: text('service_tier', { enum: ['economy', 'standard', 'premium'] }),
  vendorCost: real('vendor_cost').default(0),
  scheduledDate: text('scheduled_date'), // YYYY-MM-DD
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  qualityPassed: integer('quality_passed', { mode: 'boolean' }),
  qcNotes: text('qc_notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const workOrderStagePhotos = sqliteTable('work_order_stage_photos', {
  id: text('id').primaryKey(),
  stageId: text('stage_id')
    .notNull()
    .references(() => workOrderStages.id),
  photoPath: text('photo_path').notNull(),
  photoType: text('photo_type', {
    enum: ['BEFORE', 'DURING', 'AFTER', 'ISSUE']
  }).notNull(),
  caption: text('caption'),
  uploadedBy: text('uploaded_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const workOrderQcChecklist = sqliteTable('work_order_qc_checklist', {
  id: text('id').primaryKey(),
  stageId: text('stage_id')
    .notNull()
    .references(() => workOrderStages.id),
  item: text('item').notNull(),
  isPassed: integer('is_passed', { mode: 'boolean' }),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const workOrderNotes = sqliteTable('work_order_notes', {
  id: text('id').primaryKey(),
  workOrderId: text('work_order_id')
    .notNull()
    .references(() => workOrders.id),
  note: text('note').notNull(),
  isInternal: integer('is_internal', { mode: 'boolean' }).notNull().default(true),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const alterations = sqliteTable('alterations', {
  id: text('id').primaryKey(),
  workOrderId: text('work_order_id')
    .notNull()
    .references(() => workOrders.id),
  originalOrderId: text('original_order_id').references(() => workOrders.id),
  description: text('description').notNull(),
  alterationType: text('alteration_type', {
    enum: ['Resize', 'Repair Damage', 'Add Embellishment', 'Shorten/Lengthen', 'Remove Component', 'Other']
  }).notNull(),
  charge: real('charge').default(0),
  status: text('status').default('Pending'),
  vendorId: text('vendor_id').references(() => vendors.id),
  dueDate: text('due_date'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export type WorkOrder = typeof workOrders.$inferSelect
export type NewWorkOrder = typeof workOrders.$inferInsert
export type WorkOrderItem = typeof workOrderItems.$inferSelect
export type WorkOrderStage = typeof workOrderStages.$inferSelect
export type WorkOrderNote = typeof workOrderNotes.$inferSelect
