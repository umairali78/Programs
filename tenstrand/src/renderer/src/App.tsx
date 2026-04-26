import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/Dashboard/DashboardPage'
import { MapPage } from './pages/Map/MapPage'
import { PartnersPage } from './pages/Partners/PartnersPage'
import { ProgramsPage } from './pages/Programs/ProgramsPage'
import { AdminPage } from './pages/Admin/AdminPage'
import { SettingsPage } from './pages/Settings/SettingsPage'
import { CopilotPage } from './pages/Copilot/CopilotPage'
import { DistrictPage } from './pages/District/DistrictPage'
import { useAppStore } from './store/app.store'
import { invoke } from './lib/api'

export default function App() {
  const { setActiveTeacher, setHasClaudeKey } = useAppStore()

  useEffect(() => {
    // Bootstrap: load active teacher and settings
    invoke<Record<string, string>>('settings:getAll')
      .then(async (settings) => {
        setHasClaudeKey(!!(settings.claude_api_key?.trim()))

        if (settings.active_teacher_id) {
          const teacher = await invoke<any>('teacher:get', {
            id: settings.active_teacher_id
          }).catch(() => null)
          if (teacher) setActiveTeacher(teacher)
        }
      })
      .catch(console.error)
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/copilot" element={<CopilotPage />} />
          <Route path="/district" element={<DistrictPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
