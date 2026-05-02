'use client'
import { create } from 'zustand'

interface AuthState {
  isLoggedIn: boolean
  teacherEmail: string | null
  teacherName: string | null
  login: (email: string, name: string) => void
  logout: () => void
}

function readFromStorage(): { isLoggedIn: boolean; email: string | null; name: string | null } {
  if (typeof window === 'undefined') return { isLoggedIn: false, email: null, name: null }
  try {
    const raw = localStorage.getItem('ts_auth')
    if (!raw) return { isLoggedIn: false, email: null, name: null }
    const parsed = JSON.parse(raw)
    return { isLoggedIn: true, email: parsed.email, name: parsed.name }
  } catch {
    return { isLoggedIn: false, email: null, name: null }
  }
}

const initial = readFromStorage()

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: initial.isLoggedIn,
  teacherEmail: initial.email,
  teacherName: initial.name,
  login: (email, name) => {
    localStorage.setItem('ts_auth', JSON.stringify({ email, name }))
    set({ isLoggedIn: true, teacherEmail: email, teacherName: name })
  },
  logout: () => {
    localStorage.removeItem('ts_auth')
    set({ isLoggedIn: false, teacherEmail: null, teacherName: null })
  },
}))
