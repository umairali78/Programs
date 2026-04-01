'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  BookOpen, FileText, Video, ClipboardList, Gamepad2,
  BookMarked, GraduationCap, LayoutDashboard, Settings,
  LogOut, ShieldCheck, Users, BarChart3, ChevronRight
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/generate/new', icon: FileText, label: 'New Generation' },
  { href: '/review', icon: ClipboardList, label: 'Review Queue' },
]

const ADMIN_NAV = [
  { href: '/admin/templates', icon: BookOpen, label: 'Templates' },
  { href: '/admin/prompts', icon: FileText, label: 'Prompt Library' },
  { href: '/admin/standards', icon: ShieldCheck, label: 'Standards' },
  { href: '/admin/proposals', icon: BookMarked, label: 'Proposals' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-900 text-white flex flex-col">
        <div className="p-4 border-b border-brand-700">
          <h1 className="font-bold text-lg">ContentCraft AI</h1>
          <p className="text-xs text-brand-300 mt-0.5">Pakistan NC</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? 'bg-brand-700 text-white' : 'text-brand-200 hover:bg-brand-800 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3 text-xs font-semibold text-brand-400 uppercase tracking-wider">
                Admin
              </div>
              {ADMIN_NAV.map((item) => {
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active ? 'bg-brand-700 text-white' : 'text-brand-200 hover:bg-brand-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-brand-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">
              {session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{session?.user?.name ?? session?.user?.email}</p>
              <p className="text-xs text-brand-300">{session?.user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-brand-200 hover:bg-brand-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
