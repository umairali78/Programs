'use client'
import { create } from 'zustand'

interface Teacher {
  id: string
  name: string
  email?: string | null
  schoolId?: string | null
  gradeLevels?: string | null
  subjects?: string | null
  lat?: number | null
  lng?: number | null
  zip?: string | null
}

interface AppState {
  activeTeacher: Teacher | null
  setActiveTeacher: (teacher: Teacher | null) => void
  hasClaudeKey: boolean
  setHasClaudeKey: (val: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTeacher: null,
  setActiveTeacher: (teacher) => set({ activeTeacher: teacher }),
  hasClaudeKey: false,
  setHasClaudeKey: (val) => set({ hasClaudeKey: val })
}))
