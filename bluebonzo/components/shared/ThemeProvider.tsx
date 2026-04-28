'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'bluebonzo-theme'

export type AppTheme = 'Dark' | 'Light' | 'System'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const apply = () => applyTheme(getStoredTheme())
    apply()

    const media = window.matchMedia('(prefers-color-scheme: light)')
    media.addEventListener('change', apply)
    window.addEventListener('storage', apply)

    return () => {
      media.removeEventListener('change', apply)
      window.removeEventListener('storage', apply)
    }
  }, [])

  return children
}

export function setStoredTheme(theme: AppTheme) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}

export function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'Dark'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'Light' || stored === 'System' || stored === 'Dark' ? stored : 'Dark'
}

function applyTheme(theme: AppTheme) {
  const light = theme === 'Light' || (theme === 'System' && window.matchMedia('(prefers-color-scheme: light)').matches)
  document.documentElement.classList.toggle('light', light)
}
