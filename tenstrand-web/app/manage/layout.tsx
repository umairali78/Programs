import Link from 'next/link'
import { BookOpen, Trees, GraduationCap, LogOut, LayoutDashboard } from 'lucide-react'

const navItems = [
  { href: '/manage/programs', label: 'Programs', icon: BookOpen },
  { href: '/manage/partners', label: 'Partners', icon: Trees },
  { href: '/manage/teachers', label: 'Teachers', icon: GraduationCap },
]

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <aside className="w-52 flex flex-col bg-brand-dark text-white shrink-0">
        <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Trees className="w-4 h-4 text-green-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">Ten Strands</p>
            <p className="text-[10px] text-white/60 leading-tight">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 py-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-3 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Teacher Dashboard
          </Link>
          <a
            href="/manage/logout"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-red-300 hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </a>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
