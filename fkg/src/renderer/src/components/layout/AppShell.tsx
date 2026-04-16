import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/work-orders': 'Work Orders',
  '/customers': 'Customers',
  '/inventory': 'Inventory',
  '/fabric': 'Fabric',
  '/vendors': 'Vendors',
  '/payments': 'Payments',
  '/promotions': 'Promotions',
  '/reports': 'Reports',
  '/staff': 'Staff',
  '/audit': 'Audit Log',
  '/notifications': 'Notifications',
  '/data': 'Data Management',
  '/settings': 'Settings'
}

export function AppShell() {
  const location = useLocation()
  const base = '/' + location.pathname.split('/')[1]
  const title = PAGE_TITLES[base] ?? 'Fashion Ka Ghar MIS'

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
