// Channel → minimum role required
// Role hierarchy: admin > manager > staff > cashier > vendor_view
export type Role = 'admin' | 'manager' | 'staff' | 'cashier' | 'vendor_view'

const ROLE_RANK: Record<Role, number> = {
  admin: 5,
  manager: 4,
  staff: 3,
  cashier: 2,
  vendor_view: 1
}

export const PERMISSIONS: Record<string, Role> = {
  // Auth (public — validated separately)
  'auth:login': 'vendor_view',
  'auth:logout': 'vendor_view',
  'auth:getCurrentUser': 'vendor_view',
  'auth:changePassword': 'vendor_view',
  'auth:listUsers': 'admin',
  'auth:createUser': 'admin',
  'auth:updateUser': 'admin',
  'auth:adminResetPassword': 'admin',

  // Inventory
  'inventory:listProducts': 'cashier',
  'inventory:getProduct': 'cashier',
  'inventory:createProduct': 'manager',
  'inventory:updateProduct': 'manager',
  'inventory:deleteProduct': 'admin',
  'inventory:recordStockMovement': 'staff',
  'inventory:getLowStockProducts': 'staff',
  'inventory:listCategories': 'cashier',
  'inventory:createCategory': 'manager',
  'inventory:getStockMovements': 'staff',
  'inventory:getNextSku': 'staff',

  // Fabric
  'fabric:listFabrics': 'staff',
  'fabric:getFabric': 'staff',
  'fabric:createFabric': 'manager',
  'fabric:updateFabric': 'manager',
  'fabric:deleteFabric': 'admin',
  'fabric:recordMovement': 'staff',
  'fabric:getFabricMovements': 'staff',
  'fabric:getLowStockFabrics': 'staff',
  'fabric:listSuppliers': 'staff',
  'fabric:createSupplier': 'manager',
  'fabric:updateSupplier': 'manager',
  'fabric:deleteSupplier': 'admin',

  // Vendor
  'vendor:listVendors': 'staff',
  'vendor:getVendor': 'staff',
  'vendor:createVendor': 'manager',
  'vendor:updateVendor': 'manager',
  'vendor:deleteVendor': 'admin',
  'vendor:getVendorServices': 'vendor_view',
  'vendor:addVendorService': 'manager',
  'vendor:updateVendorService': 'manager',
  'vendor:deleteVendorService': 'admin',
  'vendor:getVendorRatings': 'staff',
  'vendor:addRating': 'staff',
  'vendor:getAvailability': 'staff',
  'vendor:setAvailability': 'manager',
  'vendor:compareVendors': 'staff',

  // Customers
  'customer:listCustomers': 'cashier',
  'customer:getCustomer': 'cashier',
  'customer:createCustomer': 'cashier',
  'customer:updateCustomer': 'staff',
  'customer:deleteCustomer': 'admin',
  'customer:getMeasurements': 'staff',
  'customer:saveMeasurement': 'staff',
  'customer:addInteraction': 'staff',
  'customer:getInteractions': 'staff',
  'customer:addLoyaltyPoints': 'cashier',
  'customer:redeemLoyaltyPoints': 'cashier',
  'customer:getUpcomingBirthdays': 'staff',
  'customer:getPendingFollowups': 'staff',
  'customer:listTags': 'cashier',
  'customer:createTag': 'manager',

  // Work Orders
  'workorder:listWorkOrders': 'cashier',
  'workorder:getWorkOrder': 'cashier',
  'workorder:getWorkOrderItems': 'cashier',
  'workorder:getWorkOrderStages': 'cashier',
  'workorder:getWorkOrderNotes': 'cashier',
  'workorder:createWorkOrder': 'cashier',
  'workorder:updateStatus': 'staff',
  'workorder:updateStageStatus': 'staff',
  'workorder:addNote': 'cashier',
  'workorder:cancelWorkOrder': 'manager',
  'workorder:getOrdersByStatus': 'cashier',
  'workorder:getOverdueOrders': 'staff',
  'workorder:getUpcomingDeliveries': 'staff',

  // Payments
  'payment:recordPayment': 'cashier',
  'payment:getPaymentsByOrder': 'cashier',
  'payment:getVendorPayments': 'staff',
  'payment:markVendorPaymentPaid': 'manager',
  'payment:listExpenses': 'manager',
  'payment:createExpense': 'manager',
  'payment:createInstallmentPlan': 'manager',
  'payment:getInstallments': 'cashier',
  'payment:getOrderBalance': 'cashier',
  'payment:getRecentPayments': 'cashier',
  'payment:getTotalRevenue': 'manager',

  // Promotions
  'promotion:listCoupons': 'cashier',
  'promotion:getCoupon': 'cashier',
  'promotion:validateCoupon': 'cashier',
  'promotion:createCoupon': 'manager',
  'promotion:updateCoupon': 'manager',
  'promotion:deleteCoupon': 'admin',
  'promotion:listPromotions': 'cashier',
  'promotion:createPromotion': 'manager',
  'promotion:updatePromotion': 'manager',
  'promotion:deletePromotion': 'admin',

  // Reports
  'report:getRevenueReport': 'manager',
  'report:getDashboardKPIs': 'cashier',
  'report:getOrdersByCategory': 'manager',
  'report:getVendorReport': 'manager',
  'report:getInventoryReport': 'manager',
  'report:getCustomerReport': 'manager',
  'report:getStaffReport': 'manager',
  'report:getExpensesReport': 'manager',

  // Staff
  'staff:listStaff': 'manager',
  'staff:getStaff': 'manager',
  'staff:createStaff': 'admin',
  'staff:updateStaff': 'admin',
  'staff:deleteStaff': 'admin',
  'staff:createCommission': 'manager',
  'staff:getCommissions': 'manager',
  'staff:markCommissionPaid': 'admin',
  'staff:getPendingCommissions': 'manager',
  'staff:markAttendance': 'manager',
  'staff:getAttendance': 'manager',
  'staff:getAttendanceSummary': 'manager',

  // Notifications
  'notification:listNotifications': 'cashier',
  'notification:markRead': 'cashier',
  'notification:markAllRead': 'cashier',
  'notification:getUnreadCount': 'cashier',

  // Backup
  'backup:createBackup': 'admin',
  'backup:restoreBackup': 'admin',
  'backup:listBackups': 'admin',

  // PDF
  'pdf:generatePdf': 'cashier',

  // Settings
  'settings:getAll': 'admin',
  'settings:get': 'cashier',
  'settings:set': 'admin',
  'settings:setBulk': 'admin',
  'settings:seedDefaults': 'admin',

  // Audit
  'audit:list': 'admin',

  // Demo
  'demo:seedData': 'admin'
}

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole]
}
