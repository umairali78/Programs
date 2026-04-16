import { create } from 'zustand'
import { invoke, subscribe } from '../lib/api'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  entityType?: string
  entityId?: string
  isRead: boolean
  createdAt: string | Date
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  load: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  addNotification: (n: Notification) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  load: async () => {
    try {
      const rows = await invoke<Notification[]>('notification:listNotifications', {})
      const unread = rows.filter((n) => !n.isRead).length
      set({ notifications: rows, unreadCount: unread })
    } catch {}
  },

  markRead: async (id: string) => {
    await invoke('notification:markRead', { id })
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1)
    }))
  },

  markAllRead: async () => {
    await invoke('notification:markAllRead', {})
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0
    }))
  },

  addNotification: (n: Notification) => {
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + (n.isRead ? 0 : 1)
    }))
  }
}))
