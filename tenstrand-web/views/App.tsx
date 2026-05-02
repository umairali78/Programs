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
import { ProspectorPage } from '@/views/Prospector/ProspectorPage'
import { OnboardingPage } from '@/views/Onboarding/OnboardingPage'
import { EquityPage } from '@/views/Equity/EquityPage'
import { DigestsPage } from '@/views/Digests/DigestsPage'
import { CommunityPage } from '@/views/Community/CommunityPage'
import { LoginPage } from '@/views/Auth/LoginPage'
import { SignupPage } from '@/views/Auth/SignupPage'
import { useAppStore } from '@/store/app.store'
import { useAuthStore } from '@/store/auth.store'
import { invoke } from '@/lib/api'
import { Toaster } from 'sonner'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuthStore()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { setActiveTeacher, setHasClaudeKey } = useAppStore()
  const [bootReady, setBootReady] = useState(false)

  useEffect(() => {
    const boot = async () => {
      await fetch('/api/init', { method: 'POST' })
      const settings = await invoke<Record<string, string>>('settings:getAll').catch(() => ({} as Record<string, string>))
      setHasClaudeKey(!!(settings.claude_api_key?.trim() || settings.openai_api_key?.trim()))
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
          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/copilot" element={<CopilotPage />} />
            <Route path="/prospector" element={<ProspectorPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/equity" element={<EquityPage />} />
            <Route path="/digests" element={<DigestsPage />} />
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
