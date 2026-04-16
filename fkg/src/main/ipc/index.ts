import { ipcMain } from 'electron'
import { AuthService } from '../services/auth.service'
import { InventoryService } from '../services/inventory.service'
import { FabricService } from '../services/fabric.service'
import { VendorService } from '../services/vendor.service'
import { CustomerService } from '../services/customer.service'
import { WorkOrderService } from '../services/workorder.service'
import { PaymentService } from '../services/payment.service'
import { PromotionService } from '../services/promotion.service'
import { ReportService } from '../services/report.service'
import { StaffService } from '../services/staff.service'
import { NotificationService } from '../services/notification.service'
import { BackupService } from '../services/backup.service'
import { PdfService } from '../services/pdf.service'
import { SettingsService } from '../services/settings.service'
import { DemoDataService } from '../services/demo-data.service'
import { getDb, getSqlite } from '../db'
import { auditLogs } from '../db/schema'
import { desc } from 'drizzle-orm'
import { PERMISSIONS, hasPermission, type Role } from './permissions'

const authSvc = new AuthService()
const inventorySvc = new InventoryService()
const fabricSvc = new FabricService()
const vendorSvc = new VendorService()
const customerSvc = new CustomerService()
const workorderSvc = new WorkOrderService()
const paymentSvc = new PaymentService()
const promotionSvc = new PromotionService()
const reportSvc = new ReportService()
const staffSvc = new StaffService()
export const notificationSvc = new NotificationService()
const backupSvc = new BackupService()
const pdfSvc = new PdfService()
const settingsSvc = new SettingsService()
const demoDataSvc = new DemoDataService()

type ApiPayload = { token?: string; data?: any }
type ApiResult = { ok: true; data: any } | { ok: false; error: string }

function handler(
  channel: string,
  fn: (payload: any, userId?: string) => Promise<any>
) {
  ipcMain.handle(channel, async (_event, payload: ApiPayload): Promise<ApiResult> => {
    try {
      const minRole = PERMISSIONS[channel]

      // Channels that don't need auth
      if (channel === 'auth:login') {
        const result = await fn(payload.data, undefined)
        return { ok: true, data: result }
      }

      if (!payload.token) return { ok: false, error: 'Unauthorized' }
      const session = await authSvc.verifySession(payload.token)
      if (!session) return { ok: false, error: 'Session expired' }

      if (minRole && !hasPermission(session.role as Role, minRole)) {
        return { ok: false, error: 'Forbidden' }
      }

      const result = await fn(payload.data, session.id)
      return { ok: true, data: result }
    } catch (err: any) {
      console.error(`[IPC Error] ${channel}:`, err)
      return { ok: false, error: err?.message ?? 'Unknown error' }
    }
  })
}

export function registerAllHandlers() {
  // Auth
  handler('auth:login', (d) => authSvc.login(d.email, d.password))
  handler('auth:logout', (d, uid) => authSvc.logout(d?.token ?? ''))
  handler('auth:getCurrentUser', (d, uid) => Promise.resolve(uid ? authSvc.getUserById(uid) : null))
  handler('auth:changePassword', (d, uid) => authSvc.changePassword(uid!, d.currentPassword, d.newPassword))
  handler('auth:listUsers', () => authSvc.listUsers())
  handler('auth:createUser', (d, uid) => authSvc.createUser(d, uid))
  handler('auth:updateUser', (d, uid) => authSvc.updateUser(d.id, d.updates, uid))
  handler('auth:adminResetPassword', (d, uid) => authSvc.adminResetPassword(d.userId, d.newPassword, uid))

  // Inventory
  handler('inventory:listProducts', (d) => inventorySvc.listProducts(d))
  handler('inventory:getProduct', (d) => inventorySvc.getProduct(d.id))
  handler('inventory:createProduct', (d, uid) => inventorySvc.createProduct(d, uid))
  handler('inventory:updateProduct', (d, uid) => inventorySvc.updateProduct(d.id, d.updates, uid))
  handler('inventory:deleteProduct', (d, uid) => inventorySvc.deleteProduct(d.id, uid))
  handler('inventory:recordStockMovement', (d, uid) => inventorySvc.recordStockMovement({ ...d, createdBy: uid }))
  handler('inventory:getLowStockProducts', () => inventorySvc.getLowStockProducts())
  handler('inventory:listCategories', () => inventorySvc.listCategories())
  handler('inventory:createCategory', (d) => inventorySvc.createCategory(d))
  handler('inventory:getStockMovements', (d) => inventorySvc.getStockMovements(d.productId))
  handler('inventory:getNextSku', (d) => inventorySvc.getNextSku(d.categoryCode))

  // Fabric
  handler('fabric:listFabrics', (d) => fabricSvc.listFabrics(d))
  handler('fabric:getFabric', (d) => fabricSvc.getFabric(d.id))
  handler('fabric:createFabric', (d, uid) => fabricSvc.createFabric(d, uid))
  handler('fabric:updateFabric', (d, uid) => fabricSvc.updateFabric(d.id, d.updates, uid))
  handler('fabric:deleteFabric', (d, uid) => fabricSvc.deleteFabric(d.id, uid))
  handler('fabric:recordMovement', (d) => fabricSvc.recordMovement(d))
  handler('fabric:getFabricMovements', (d) => fabricSvc.getFabricMovements(d.fabricId))
  handler('fabric:getLowStockFabrics', () => fabricSvc.getLowStockFabrics())
  handler('fabric:listSuppliers', () => fabricSvc.listSuppliers())
  handler('fabric:createSupplier', (d) => fabricSvc.createSupplier(d))
  handler('fabric:updateSupplier', (d) => fabricSvc.updateSupplier(d.id, d.updates))
  handler('fabric:deleteSupplier', (d) => fabricSvc.deleteSupplier(d.id))

  // Vendor
  handler('vendor:listVendors', (d) => vendorSvc.listVendors(d))
  handler('vendor:getVendor', (d) => vendorSvc.getVendor(d.id))
  handler('vendor:createVendor', (d, uid) => vendorSvc.createVendor(d, uid))
  handler('vendor:updateVendor', (d, uid) => vendorSvc.updateVendor(d.id, d.updates, uid))
  handler('vendor:deleteVendor', (d, uid) => vendorSvc.deleteVendor(d.id, uid))
  handler('vendor:getVendorServices', (d) => vendorSvc.getVendorServices(d.vendorId))
  handler('vendor:addVendorService', (d) => vendorSvc.addVendorService(d))
  handler('vendor:updateVendorService', (d) => vendorSvc.updateVendorService(d.id, d.updates))
  handler('vendor:deleteVendorService', (d) => vendorSvc.deleteVendorService(d.id))
  handler('vendor:getVendorRatings', (d) => vendorSvc.getVendorRatings(d.vendorId))
  handler('vendor:addRating', (d) => vendorSvc.addRating(d))
  handler('vendor:getAvailability', (d) => vendorSvc.getAvailability(d.vendorId, d.month))
  handler('vendor:setAvailability', (d) => vendorSvc.setAvailability(d.vendorId, d.date, d.isAvailable, d.capacitySlots))
  handler('vendor:compareVendors', (d) => vendorSvc.compareVendors(d.vendorIds))

  // Customer
  handler('customer:listCustomers', (d) => customerSvc.listCustomers(d))
  handler('customer:getCustomer', (d) => customerSvc.getCustomer(d.id))
  handler('customer:createCustomer', (d, uid) => customerSvc.createCustomer(d, uid))
  handler('customer:updateCustomer', (d, uid) => customerSvc.updateCustomer(d.id, d.updates, uid))
  handler('customer:deleteCustomer', (d, uid) => customerSvc.deleteCustomer(d.id, uid))
  handler('customer:getMeasurements', (d) => customerSvc.getMeasurements(d.customerId))
  handler('customer:saveMeasurement', (d) => customerSvc.saveMeasurement(d))
  handler('customer:addInteraction', (d) => customerSvc.addInteraction(d))
  handler('customer:getInteractions', (d) => customerSvc.getInteractions(d.customerId))
  handler('customer:addLoyaltyPoints', (d) => customerSvc.addLoyaltyPoints(d.customerId, d.points))
  handler('customer:redeemLoyaltyPoints', (d) => customerSvc.redeemLoyaltyPoints(d.customerId, d.points))
  handler('customer:getUpcomingBirthdays', (d) => customerSvc.getUpcomingBirthdays(d?.days ?? 7))
  handler('customer:getPendingFollowups', () => customerSvc.getPendingFollowups())
  handler('customer:listTags', () => customerSvc.listTags())
  handler('customer:createTag', (d) => customerSvc.createTag(d.name, d.color))

  // Work Orders
  handler('workorder:listWorkOrders', (d) => workorderSvc.listWorkOrders(d))
  handler('workorder:getWorkOrder', (d) => workorderSvc.getWorkOrder(d.id))
  handler('workorder:getWorkOrderItems', (d) => workorderSvc.getWorkOrderItems(d.workOrderId))
  handler('workorder:getWorkOrderStages', (d) => workorderSvc.getWorkOrderStages(d.workOrderId))
  handler('workorder:getWorkOrderNotes', (d) => workorderSvc.getWorkOrderNotes(d.workOrderId))
  handler('workorder:createWorkOrder', (d, uid) => workorderSvc.createWorkOrder({ ...d, createdBy: uid }))
  handler('workorder:updateStatus', (d, uid) => workorderSvc.updateStatus(d.id, d.status, uid))
  handler('workorder:updateStageStatus', (d, uid) => workorderSvc.updateStageStatus(d.stageId, d.status, { ...d.opts, userId: uid }))
  handler('workorder:addNote', (d, uid) => workorderSvc.addNote(d.workOrderId, d.note, d.isInternal, uid))
  handler('workorder:cancelWorkOrder', (d, uid) => workorderSvc.cancelWorkOrder(d.id, d.reason, uid))
  handler('workorder:getOrdersByStatus', () => workorderSvc.getOrdersByStatus())
  handler('workorder:getOverdueOrders', () => workorderSvc.getOverdueOrders())
  handler('workorder:getUpcomingDeliveries', (d) => workorderSvc.getUpcomingDeliveries(d?.days ?? 7))

  // Payments
  handler('payment:recordPayment', (d, uid) => paymentSvc.recordPayment({ ...d, receivedBy: uid }))
  handler('payment:getPaymentsByOrder', (d) => paymentSvc.getPaymentsByOrder(d.workOrderId))
  handler('payment:getVendorPayments', (d) => paymentSvc.getVendorPayments(d))
  handler('payment:markVendorPaymentPaid', (d, uid) => paymentSvc.markVendorPaymentPaid(d.id, uid, d.referenceNo))
  handler('payment:listExpenses', (d) => paymentSvc.listExpenses(d))
  handler('payment:createExpense', (d, uid) => paymentSvc.createExpense({ ...d, createdBy: uid }))
  handler('payment:createInstallmentPlan', (d) => paymentSvc.createInstallmentPlan(d.workOrderId, d.installments))
  handler('payment:getInstallments', (d) => paymentSvc.getInstallments(d.workOrderId))
  handler('payment:getOrderBalance', (d) => paymentSvc.getOrderBalance(d.workOrderId))
  handler('payment:getRecentPayments', (d) => paymentSvc.getRecentPayments(d?.limit))
  handler('payment:getTotalRevenue', (d) => paymentSvc.getTotalRevenue(d?.dateFrom, d?.dateTo))

  // Promotions
  handler('promotion:listCoupons', (d) => promotionSvc.listCoupons(d?.activeOnly))
  handler('promotion:getCoupon', (d) => promotionSvc.getCoupon(d.id))
  handler('promotion:validateCoupon', (d) => promotionSvc.validateCoupon(d.code, d.orderAmount))
  handler('promotion:createCoupon', (d, uid) => promotionSvc.createCoupon(d, uid))
  handler('promotion:updateCoupon', (d, uid) => promotionSvc.updateCoupon(d.id, d.updates, uid))
  handler('promotion:deleteCoupon', (d, uid) => promotionSvc.deleteCoupon(d.id, uid))
  handler('promotion:listPromotions', (d) => promotionSvc.listPromotions(d?.activeOnly))
  handler('promotion:createPromotion', (d, uid) => promotionSvc.createPromotion(d, uid))
  handler('promotion:updatePromotion', (d, uid) => promotionSvc.updatePromotion(d.id, d.updates, uid))
  handler('promotion:deletePromotion', (d, uid) => promotionSvc.deletePromotion(d.id, uid))

  // Reports
  handler('report:getRevenueReport', (d) => reportSvc.getRevenueReport(d.dateFrom, d.dateTo, d.groupBy))
  handler('report:getDashboardKPIs', () => reportSvc.getDashboardKPIs())
  handler('report:getOrdersByCategory', () => reportSvc.getOrdersByCategory())
  handler('report:getVendorReport', (d) => reportSvc.getVendorReport(d.dateFrom, d.dateTo))
  handler('report:getInventoryReport', () => reportSvc.getInventoryReport())
  handler('report:getCustomerReport', () => reportSvc.getCustomerReport())
  handler('report:getStaffReport', (d) => reportSvc.getStaffReport(d.month))
  handler('report:getExpensesReport', (d) => reportSvc.getExpensesReport(d.dateFrom, d.dateTo))

  // Staff
  handler('staff:listStaff', (d) => staffSvc.listStaff(d?.activeOnly))
  handler('staff:getStaff', (d) => staffSvc.getStaff(d.id))
  handler('staff:createStaff', (d, uid) => staffSvc.createStaff(d, uid))
  handler('staff:updateStaff', (d, uid) => staffSvc.updateStaff(d.id, d.updates, uid))
  handler('staff:deleteStaff', (d, uid) => staffSvc.deleteStaff(d.id, uid))
  handler('staff:createCommission', (d) => staffSvc.createCommission(d))
  handler('staff:getCommissions', (d) => staffSvc.getCommissions(d.staffId))
  handler('staff:markCommissionPaid', (d, uid) => staffSvc.markCommissionPaid(d.id, uid))
  handler('staff:getPendingCommissions', () => staffSvc.getPendingCommissions())
  handler('staff:markAttendance', (d) => staffSvc.markAttendance(d))
  handler('staff:getAttendance', (d) => staffSvc.getAttendance(d.staffId, d.month))
  handler('staff:getAttendanceSummary', (d) => staffSvc.getAttendanceSummary(d.staffId, d.month))

  // Notifications
  handler('notification:listNotifications', (d, uid) => notificationSvc.listNotifications(uid, d?.unreadOnly))
  handler('notification:markRead', (d) => notificationSvc.markRead(d.id))
  handler('notification:markAllRead', (d, uid) => notificationSvc.markAllRead(uid))
  handler('notification:getUnreadCount', (d, uid) => notificationSvc.getUnreadCount(uid))

  // Backup
  handler('backup:createBackup', (d) => backupSvc.createBackup(d?.destDir))
  handler('backup:restoreBackup', (d) => backupSvc.restoreBackup(d.zipPath))
  handler('backup:listBackups', (d) => Promise.resolve(backupSvc.listBackups(d?.dir)))

  // PDF
  handler('pdf:generatePdf', (d) => pdfSvc.generatePdf(d.html, d.fileName))

  // Settings
  handler('settings:getAll', () => settingsSvc.getAll())
  handler('settings:get', (d) => Promise.resolve(settingsSvc.get(d.key)))
  handler('settings:set', (d) => settingsSvc.set(d.key, d.value))
  handler('settings:setBulk', (d) => settingsSvc.setBulk(d))
  handler('settings:seedDefaults', () => settingsSvc.seedDefaults())

  // Audit log
  handler('audit:list', async (d) => {
    const db = getDb()
    let rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt))
    if (d?.userId) rows = rows.filter((r) => r.userId === d.userId)
    if (d?.entityType) rows = rows.filter((r) => r.entityType === d.entityType)
    if (d?.action) rows = rows.filter((r) => r.action === d.action)
    if (d?.limit) rows = rows.slice(0, d.limit)
    return rows
  })

  // Demo data
  handler('demo:seedData', (_d, uid) => demoDataSvc.seed(uid))

  // Onboarding public channels (no auth)
  ipcMain.handle('auth:isFirstRun', async () => {
    try {
      const result = await authSvc.isFirstRun()
      return { ok: true, data: result }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('auth:createAdminUser', async (_event, payload: ApiPayload) => {
    try {
      const result = await authSvc.createAdminUser(payload.data)
      return { ok: true, data: result }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })
}
