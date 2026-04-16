import { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { invoke, subscribe } from './lib/api'
import { useAuthStore } from './store/auth.store'
import { useNotificationStore } from './store/notification.store'
import { AppShell } from './components/layout/AppShell'
import { SplashScreen } from './components/common/SplashScreen'
import { LoginPage } from './pages/Auth/LoginPage'
import { OnboardingPage } from './pages/Onboarding/OnboardingPage'
import { DashboardPage } from './pages/Dashboard/DashboardPage'
import { InventoryPage } from './pages/Inventory/InventoryPage'
import { FabricPage } from './pages/Fabric/FabricPage'
import { VendorsPage } from './pages/Vendors/VendorsPage'
import { CustomersPage } from './pages/Customers/CustomersPage'
import { WorkOrdersPage } from './pages/WorkOrders/WorkOrdersPage'
import { WorkOrderDetailPage } from './pages/WorkOrders/WorkOrderDetailPage'
import { PaymentsPage } from './pages/Payments/PaymentsPage'
import { PromotionsPage } from './pages/Promotions/PromotionsPage'
import { ReportsPage } from './pages/Reports/ReportsPage'
import { StaffPage } from './pages/Staff/StaffPage'
import { AuditLogPage } from './pages/AuditLog/AuditLogPage'
import { NotificationsPage } from './pages/Notifications/NotificationsPage'
import { DataManagementPage } from './pages/DataManagement/DataManagementPage'
import { SettingsPage } from './pages/Settings/SettingsPage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { user, isLoading, login, setLoading } = useAuthStore()
  const { addNotification, load: loadNotifications } = useNotificationStore()
  const [firstRun, setFirstRun] = useState<boolean | null>(null)

  useEffect(() => {
    const init = async () => {
      let restoredUser = null

      // Check if first run
      try {
        const isFirst = await invoke<boolean>('auth:isFirstRun')
        setFirstRun(isFirst)
      } catch {
        setFirstRun(false)
      }

      // Try to restore session
      const raw = localStorage.getItem('fkg_session')
      if (raw) {
        try {
          const { token: storedToken } = JSON.parse(raw)
          if (storedToken) {
            restoredUser = await invoke('auth:getCurrentUser')
            if (restoredUser) {
              login(restoredUser, storedToken)
            } else {
              localStorage.removeItem('fkg_session')
            }
          }
        } catch {
          localStorage.removeItem('fkg_session')
        }
      }

      if (!restoredUser) {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Subscribe to push notifications from main process
  useEffect(() => {
    const unsub = subscribe('notification:push', (n: any) => {
      addNotification(n)
    })
    return unsub
  }, [])

  // Load notifications when user is logged in
  useEffect(() => {
    if (user) loadNotifications()
  }, [user])

  if (firstRun === null || isLoading) {
    return (
      <SplashScreen
        message={firstRun === null ? 'Opening your atelier dashboard' : 'Restoring your session'}
        detail={
          firstRun === null
            ? 'Checking first-run setup, loading settings, and preparing the interface.'
            : 'Verifying your access and bringing your workspace back exactly where you left it.'
        }
      />
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={firstRun ? <Navigate to="/onboarding" replace /> : <LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Protected */}
        <Route element={<AuthGuard><AppShell /></AuthGuard>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/fabric" element={<FabricPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/work-orders" element={<WorkOrdersPage />} />
          <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/audit" element={<AuditLogPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/data" element={<DataManagementPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Default */}
        <Route path="/" element={
          firstRun ? <Navigate to="/onboarding" replace /> :
          user ? <Navigate to="/dashboard" replace /> :
          <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
