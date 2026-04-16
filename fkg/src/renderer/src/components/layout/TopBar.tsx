import { Bell, LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { useNotificationStore } from '../../store/notification.store'
import { invoke } from '../../lib/api'
import { getInitials } from '../../lib/utils'

interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  const { user, token, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await invoke('auth:logout', { token })
    } finally {
      logout()
      navigate('/login')
    }
  }

  return (
    <header className="h-14 bg-white border-b border-app-border flex items-center px-6 gap-4 shrink-0">
      <h1 className="text-base font-semibold text-dark flex-1">{title}</h1>

      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-lg hover:bg-surface text-dark/60 hover:text-dark transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[10px] rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-xs font-semibold">
          {user ? getInitials(user.name) : 'U'}
        </div>
        <div className="text-sm hidden sm:block">
          <div className="font-medium text-dark leading-tight">{user?.name}</div>
          <div className="text-dark/40 text-xs capitalize">{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          className="ml-2 p-2 rounded-lg hover:bg-surface text-dark/60 hover:text-brand transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
