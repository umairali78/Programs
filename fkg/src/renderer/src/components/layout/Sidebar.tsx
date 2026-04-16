import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Scissors, Users, ShoppingBag, CreditCard,
  Tag, BarChart2, UserCheck, Bell, Database, Settings,
  ChevronLeft, ChevronRight, BookOpen, ClipboardList
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useUiStore } from '../../store/ui.store'
import { useAuthStore } from '../../store/auth.store'
import { useNotificationStore } from '../../store/notification.store'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/work-orders', icon: ShoppingBag, label: 'Work Orders' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/fabric', icon: Scissors, label: 'Fabric' },
  { to: '/vendors', icon: UserCheck, label: 'Vendors' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/promotions', icon: Tag, label: 'Promotions' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/staff', icon: ClipboardList, label: 'Staff', roles: ['admin', 'manager'] },
  { to: '/audit', icon: BookOpen, label: 'Audit Log', roles: ['admin'] },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/data', icon: Database, label: 'Data Mgmt', roles: ['admin'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] }
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user } = useAuthStore()
  const { unreadCount } = useNotificationStore()

  const filteredNav = navItems.filter((item) => {
    if (!item.roles) return true
    return user && item.roles.includes(user.role)
  })

  return (
    <aside
      className={cn(
        'flex flex-col bg-dark text-white transition-all duration-200 shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-white/10', sidebarCollapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">FKG</span>
        </div>
        {!sidebarCollapsed && (
          <div>
            <div className="font-semibold text-sm leading-tight">Fashion Ka Ghar</div>
            <div className="text-white/40 text-xs">MIS</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {filteredNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors relative',
                isActive ? 'bg-brand text-white' : 'text-white/60 hover:text-white hover:bg-white/10',
                sidebarCollapsed && 'justify-center'
              )
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{label}</span>}
            {label === 'Notifications' && unreadCount > 0 && (
              <span className={cn(
                'bg-brand text-white text-xs rounded-full flex items-center justify-center shrink-0',
                sidebarCollapsed ? 'absolute top-1 right-1 w-4 h-4 text-[10px]' : 'ml-auto w-5 h-5'
              )}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-10 border-t border-white/10 text-white/40 hover:text-white transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
