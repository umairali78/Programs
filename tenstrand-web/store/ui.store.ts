'use client'
import { create } from 'zustand'

interface UiState {
  sidebarCollapsed: boolean
  copilotOpen: boolean
  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setCopilotOpen: (v: boolean) => void
  toggleCopilot: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  copilotOpen: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCopilotOpen: (v) => set({ copilotOpen: v }),
  toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen }))
}))
