'use client'
import { NavLink, useNavigate } from 'react-router-dom'
import { Map, Trees, BookOpen, Users, Settings, MessageSquare, Home, GraduationCap, Search, UserPlus, BarChart2, Mail, LogOut, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/map', label: 'Explore Map', icon: Map },
  { to: '/community', label: 'Community', icon: Globe },
  { to: '/onboarding', label: 'Partner Onboarding', icon: UserPlus },
  { to: '/partners', label: 'Partners', icon: Trees },
  { to: '/programs', label: 'Programs', icon: BookOpen },
  { to: '/teachers', label: 'Teachers', icon: GraduationCap },
  { to: '/prospector', label: 'Prospector', icon: Search },
  { to: '/equity', label: 'Equity Mapper', icon: BarChart2 },
  { to: '/digests', label: 'Digests', icon: Mail },
  { to: '/copilot', label: 'AI Copilot', icon: MessageSquare },
  { to: '/admin', label: 'Admin', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const { logout, teacherName } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully.')
    navigate('/login', { replace: true })
  }

  return (
    <aside className={cn('flex flex-col bg-brand-dark text-white transition-all duration-200 shrink-0', collapsed ? 'w-14' : 'w-52')}>
      <div className="flex items-center gap-2 px-3 py-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <Trees className="w-4 h-4 text-green-300" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-xs font-bold leading-tight text-white">Ten Strands</p>
            <p className="text-[10px] text-white/60 leading-tight">Climate Exchange</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              cn('flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/10')
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-3 py-3 space-y-2">
        {!collapsed && teacherName && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">{teacherName.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
            </div>
            <span className="text-[11px] text-white/70 truncate">{teacherName}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors',
            collapsed && 'justify-center'
          )}
          title="Sign out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">Sign Out</span>}
        </button>
        <p className="text-[10px] text-white/30 text-center">{collapsed ? 'v2' : 'v2.0 — Phase 1-5'}</p>
      </div>
    </aside>
  )
}
