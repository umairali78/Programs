import { create } from 'zustand'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: SessionUser | null
  token: string | null
  isLoading: boolean
  login: (user: SessionUser, token: string) => void
  logout: () => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  login: (user, token) => {
    localStorage.setItem('fkg_session', JSON.stringify({ token }))
    set({ user, token, isLoading: false })
  },
  logout: () => {
    localStorage.removeItem('fkg_session')
    set({ user: null, token: null })
  },
  setLoading: (v) => set({ isLoading: v })
}))
