import { useEffect } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useNotificationStore } from '../../store/notification.store'
import { relativeTime } from '../../lib/utils'

const TYPE_ICONS: Record<string, string> = {
  ORDER_OVERDUE: '🔴',
  DEADLINE_APPROACHING: '⏰',
  LOW_STOCK: '📦',
  LOW_FABRIC_STOCK: '🧵',
  INSTALLMENT_OVERDUE: '💰',
  BIRTHDAY: '🎂'
}

export function NotificationsPage() {
  const { notifications, load, markRead, markAllRead } = useNotificationStore()

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-dark">Notifications</h2>
          <p className="text-sm text-dark/40">{notifications.filter((n) => !n.isRead).length} unread</p>
        </div>
        <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-brand hover:underline"><CheckCheck size={14} /> Mark all read</button>
      </div>

      {notifications.length === 0 && (
        <div className="bg-white rounded-card border border-app-border flex flex-col items-center py-16 text-dark/30">
          <Bell size={32} className="mb-3" />
          <p>No notifications</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className={`bg-white rounded-card border p-4 flex items-start gap-3 transition-colors ${n.isRead ? 'border-app-border' : 'border-brand/30 bg-brand/5'}`}>
            <span className="text-xl shrink-0">{TYPE_ICONS[n.type] ?? '🔔'}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-dark">{n.title}</div>
              <div className="text-sm text-dark/60 mt-0.5">{n.body}</div>
              <div className="text-xs text-dark/30 mt-1">{relativeTime(n.createdAt)}</div>
            </div>
            {!n.isRead && (
              <button onClick={() => markRead(n.id)} className="shrink-0 p-1.5 hover:bg-surface rounded-lg text-dark/40 hover:text-brand"><Check size={14} /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
