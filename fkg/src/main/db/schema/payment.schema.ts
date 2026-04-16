import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { users } from './auth.schema'
import { vendors } from './vendor.schema'
import { workOrders, workOrderStages } from './workorder.schema'

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  workOrderId: text('work_order_id')
    .notNull()
    .references(() => workOrders.id),
  amount: real('amount').notNull(),
  paymentType: text('payment_type', {
    enum: ['ADVANCE', 'PARTIAL', 'FINAL', 'REFUND']
  }).notNull(),
  method: text('method', {
    enum: ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Installment', 'Loyalty Points']
  }).notNull(),
  referenceNo: text('reference_no'),
  note: text('note'),
  receivedBy: text('received_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const installments = sqliteTable('installments', {
  id: text('id').primaryKey(),
  workOrderId: text('work_order_id')
    .notNull()
    .references(() => workOrders.id),
  amount: real('amount').notNull(),
  dueDate: text('due_date').notNull(),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  paymentId: text('payment_id').references(() => payments.id),
  status: text('status', { enum: ['Pending', 'Paid', 'Overdue'] }).notNull().default('Pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const vendorPayments = sqliteTable('vendor_payments', {
  id: text('id').primaryKey(),
  vendorId: text('vendor_id')
    .notNull()
    .references(() => vendors.id),
  workOrderId: text('work_order_id').references(() => workOrders.id),
  stageId: text('stage_id').references(() => workOrderStages.id),
  serviceType: text('service_type'),
  amount: real('amount').notNull(),
  status: text('status', { enum: ['Pending', 'Paid', 'Overdue', 'Disputed'] })
    .notNull()
    .default('Pending'),
  dueDate: text('due_date'),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  paidBy: text('paid_by').references(() => users.id),
  referenceNo: text('reference_no'),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  category: text('category', {
    enum: ['Rent', 'Utilities', 'Transport', 'Supplies', 'Marketing', 'Staff Salary', 'Other']
  }).notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  method: text('method', { enum: ['Cash', 'Bank Transfer', 'Card', 'Cheque'] }).notNull(),
  vendorId: text('vendor_id').references(() => vendors.id),
  staffId: text('staff_id'),
  receiptPath: text('receipt_path'),
  expenseDate: text('expense_date').notNull(),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type VendorPayment = typeof vendorPayments.$inferSelect
export type Expense = typeof expenses.$inferSelect
export type Installment = typeof installments.$inferSelect
