'use client'
import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/views/Dashboard/DashboardPage'
import { MapPage } from '@/views/Map/MapPage'
import { PartnersPage } from '@/views/Partners/PartnersPage'
import { ProgramsPage } from '@/views/Programs/ProgramsPage'
import { TeachersPage } from '@/views/Teachers/TeachersPage'
import { AdminPage } from '@/views/Admin/AdminPage'
import { SettingsPage } from '@/views/Settings/SettingsPage'
import { CopilotPage } from '@/views/Copilot/CopilotPage'
import { DistrictPage } from '@/views/District/DistrictPage'
import { useAppStore } from '@/store/app.store'
import { invoke } from '@/lib/api'
import { Toaster } from 'sonner'

export default function App() {
  const { setActiveTeacher, setHasClaudeKey } = useAppStore()
  const [bootReady, setBootReady] = useState(false)

  useEffect(() => {
    const boot = async () => {
      // /api/init creates tables + seeds demo in one server-side batch call
      await fetch('/api/init', { method: 'POST' })
      const settings = await invoke<Record<string, string>>('settings:getAll').catch(() => ({} as Record<string, string>))
      setHasClaudeKey(!!(settings.claude_api_key?.trim()))
      if (settings.active_teacher_id) {
        const teacher = await invoke<any>('teacher:get', { id: settings.active_teacher_id }).catch(() => null)
        if (teacher) setActiveTeacher(teacher)
      }
    }

    boot()
      .catch(console.error)
      .finally(() => setBootReady(true))
  }, [setActiveTeacher, setHasClaudeKey])

  if (!bootReady) {
    return (
      <div className="h-screen bg-surface flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading Climate Learning Exchange…</p>
      </div>
    )
  }

  return (
    <>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/copilot" element={<CopilotPage />} />
            <Route path="/district" element={<DistrictPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster richColors position="bottom-right" />
    </>
  )
}
