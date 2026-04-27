'use client'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Toaster } from 'sonner'
import { CopilotPanel } from '../copilot/CopilotPanel'
import { useUiStore } from '@/store/ui.store'

export function AppShell() {
  const copilotOpen = useUiStore((s) => s.copilotOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
        {copilotOpen && <CopilotPanel />}
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
