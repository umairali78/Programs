'use client'
import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Save, Eye, EyeOff, Loader2 } from 'lucide-react'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app.store'

interface Teacher { id: string; name: string; email?: string | null }

export function SettingsPage() {
  const { setActiveTeacher, setHasClaudeKey } = useAppStore()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [allSettings, teacherList] = await Promise.all([invoke<Record<string, string>>('settings:getAll'), invoke<Teacher[]>('teacher:list')])
      setSettings(allSettings)
      setTeachers(teacherList)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await invoke('settings:setBulk', settings)
      if (settings.active_teacher_id) {
        const teacher = await invoke<any>('teacher:get', { id: settings.active_teacher_id })
        setActiveTeacher(teacher)
      } else { setActiveTeacher(null) }
      setHasClaudeKey(!!(settings.claude_api_key?.trim() || settings.openai_api_key?.trim()))
      toast.success('Settings saved')
    } catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  const updateSetting = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }))

  if (loading) return <div className="flex flex-col h-full"><TopBar title="Settings" /><div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div></div>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Settings">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save Settings
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="max-w-xl space-y-6">
          <Section title="Active Teacher" description="The teacher whose profile is used for personalized recommendations.">
            <Field label="Select Active Teacher">
              <select value={settings.active_teacher_id ?? ''} onChange={(e) => updateSetting('active_teacher_id', e.target.value)} className={inputClass}>
                <option value="">— No active teacher —</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} {t.email ? `(${t.email})` : ''}</option>)}
              </select>
            </Field>
          </Section>

          <Section title="Map Defaults">
            <Field label="Default Search Radius (miles)">
              <select value={settings.default_radius_miles ?? '20'} onChange={(e) => updateSetting('default_radius_miles', e.target.value)} className={inputClass}>
                {[5, 10, 20, 30, 50].map((r) => <option key={r} value={String(r)}>{r} miles</option>)}
              </select>
            </Field>
          </Section>

          <Section title="AI Provider" description="Used for matching explanations, AI copilot, digest generation, and standards suggestions.">
            <Field label="Provider">
              <select value={settings.ai_provider ?? 'claude'} onChange={(e) => updateSetting('ai_provider', e.target.value)} className={inputClass}>
                <option value="claude">Claude</option>
                <option value="openai">OpenAI</option>
              </select>
            </Field>
            <Field label="Claude API Key">
              <div className="relative">
                <input type={showApiKey ? 'text' : 'password'} value={settings.claude_api_key ?? ''} onChange={(e) => updateSetting('claude_api_key', e.target.value)} className={inputClass + ' pr-8'} placeholder="sk-ant-..." />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {settings.claude_api_key && <p className="mt-1 text-xs text-green-600">✓ API key configured</p>}
            </Field>
            <Field label="OpenAI API Key">
              <div className="relative">
                <input type={showApiKey ? 'text' : 'password'} value={settings.openai_api_key ?? ''} onChange={(e) => updateSetting('openai_api_key', e.target.value)} className={inputClass + ' pr-8'} placeholder="sk-..." />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {settings.openai_api_key && <p className="mt-1 text-xs text-green-600">✓ API key configured</p>}
            </Field>
            <Field label="OpenAI Model">
              <input value={settings.openai_model ?? 'gpt-4o-mini'} onChange={(e) => updateSetting('openai_model', e.target.value)} className={inputClass} placeholder="gpt-4o-mini" />
            </Field>
          </Section>

          <Section title="Policy Update" description="AB 2158 status message shown in teacher digests.">
            <Field label="AB 2158 Status Note">
              <textarea value={settings.ab2158_status ?? ''} onChange={(e) => updateSetting('ab2158_status', e.target.value)} rows={3} className={inputClass} />
            </Field>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <div><div className="mb-3"><h3 className="text-sm font-semibold text-gray-900">{title}</h3>{description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}</div><div className="bg-white border border-app-border rounded-xl p-4 space-y-3">{children}</div></div>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>{children}</div>
}
const inputClass = 'w-full text-xs border border-app-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand bg-white'
