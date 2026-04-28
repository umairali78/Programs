'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Waves, MessageSquare, LayoutDashboard, FileText,
  Bell, History, Settings, LogOut, ChevronLeft, ChevronRight,
  Zap, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { href: '/query', label: 'Intelligence Query', icon: MessageSquare, badge: null },
  { href: '/dashboard', label: 'Market Pulse', icon: LayoutDashboard, badge: null },
  { href: '/report-bank', label: 'Report Bank', icon: FileText, badge: null },
  { href: '/alerts', label: 'Regulatory Alerts', icon: Bell, badge: null },
  { href: '/history', label: 'Query History', icon: History, badge: null },
]

const BOTTOM_NAV = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => r.json())
      .then(d => setUnreadAlerts((d.alerts ?? []).filter((alert: { isRead?: boolean }) => !alert.isRead).length))
      .catch(() => {})
  }, [])

  return (
    <aside className={cn(
      'h-full flex flex-col border-r border-border bg-card transition-all duration-200',
      collapsed ? 'w-14' : 'w-56'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-border', collapsed && 'justify-center p-3')}>
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Waves className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm text-gradient leading-none">BlueBonzo AI</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Market Intelligence</div>
          </div>
        )}
      </div>

      {/* Demo mode badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-2 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="text-[10px] text-amber-400 font-medium">Demo Mode Active</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 mt-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname.startsWith(href)
          const displayBadge = href === '/alerts' && unreadAlerts > 0 ? String(unreadAlerts) : badge
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-all group relative',
                active
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active && 'text-primary')} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {displayBadge && (
                    <span className="text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center">
                      {displayBadge}
                    </span>
                  )}
                </>
              )}
              {collapsed && displayBadge && (
                <span className="absolute top-0.5 right-0.5 text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {displayBadge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Market indicator */}
      {!collapsed && (
        <div className="mx-3 mb-2 p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-medium mb-1">
            <TrendingUp className="w-3 h-3" />
            Carrageenan SRC
          </div>
          <div className="text-sm font-bold text-foreground">$2.35/kg</div>
          <div className="text-[10px] text-destructive">↓ 8.2% vs last month</div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="p-2 border-t border-border space-y-0.5">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
              'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all',
              collapsed && 'justify-center px-0'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {/* User + Logout */}
        {session && (
          <div className={cn(
            'flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer',
            collapsed && 'justify-center px-0'
          )}>
            <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
              {session.user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{session.user?.name ?? 'User'}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{session.user?.tier}</div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-xs text-muted-foreground hover:bg-secondary transition-all',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  )
}
