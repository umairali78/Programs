'use client'
import { useEffect, useRef, useState } from 'react'
import { Bot, CheckCircle2, ChevronRight, Loader2, Plus, RefreshCw, Send, Sparkles, User } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app.store'

interface Message { role: 'user' | 'assistant'; content: string }
interface ProfilePreview {
  name: string; description: string; type: string
  gradeLevels: string[]; subjects: string[]; county: string
  address: string; contactEmail: string; website: string
}

const GREETING = "Hi! I'm the Ten Strands onboarding assistant. I'll help you create a compelling profile on the Climate Learning Exchange — it only takes a few minutes. To start: what is your organization's name?"

export function OnboardingPage() {
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)
  const [stage, setStage] = useState<'chat' | 'preview' | 'done'>('chat')
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: GREETING }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [collectedData, setCollectedData] = useState<Record<string, string>>({})
  const [profile, setProfile] = useState<ProfilePreview | null>(null)
  const [saving, setSaving] = useState(false)
  const [buildingProfile, setBuildingProfile] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setSending(true)

    try {
      const history = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
      const result = await invoke<{ reply: string; updatedData: Record<string, string>; complete: boolean }>(
        'onboarding:turn',
        { history, message: text, collectedData }
      )

      const merged = { ...collectedData, ...result.updatedData }
      setCollectedData(merged)
      setMessages([...newMessages, { role: 'assistant', content: result.reply }])

      if (result.complete) {
        setBuildingProfile(true)
        try {
          const built = await invoke<ProfilePreview | null>('onboarding:buildProfile', { data: merged })
          if (built) { setProfile(built); setStage('preview') }
          else toast.error('Could not build profile — please try again')
        } finally { setBuildingProfile(false) }
      }
    } catch { toast.error('AI unavailable — configure an API key in Settings') }
    finally { setSending(false) }
  }

  const handleCreatePartner = async () => {
    if (!profile) return
    setSaving(true)
    try {
      await invoke('onboarding:createPartner', {
        name: profile.name,
        description: profile.description,
        type: profile.type,
        county: profile.county,
        address: profile.address,
        contactEmail: profile.contactEmail,
        website: profile.website,
        gradeLevels: profile.gradeLevels,
        subjects: profile.subjects,
        status: 'active',
      })
      toast.success('Partner profile created!')
      setStage('done')
    } catch (err: any) { toast.error('Failed to create partner: ' + err.message) }
    finally { setSaving(false) }
  }

  const handleReset = () => {
    setStage('chat')
    setMessages([{ role: 'assistant', content: GREETING }])
    setInput('')
    setCollectedData({})
    setProfile(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Partner Onboarding Agent">
        {stage !== 'chat' && (
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />New Onboarding
          </button>
        )}
      </TopBar>

      {!hasClaudeKey && (
        <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Onboarding Agent requires an AI API key. Add your Claude or OpenAI key in <strong>Settings</strong>.</span>
        </div>
      )}

      {stage === 'chat' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Progress indicator */}
          {Object.keys(collectedData).length > 0 && (
            <div className="px-6 pt-3">
              <div className="bg-white border border-app-border rounded-xl p-3 flex flex-wrap gap-2">
                {[['orgName','Organization'], ['description','Description'], ['programs','Programs'], ['gradeLevels','Grades'], ['subjects','Subjects'], ['county','County'], ['address','Address'], ['contactEmail','Email'], ['website','Website']].map(([key, label]) => (
                  <span key={key} className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${collectedData[key] ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    {collectedData[key] && <CheckCircle2 className="w-2.5 h-2.5" />}{label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === 'assistant' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {m.role === 'assistant' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <div className={`max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'assistant' ? 'bg-white border border-app-border text-gray-800' : 'bg-brand text-white'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {(sending || buildingProfile) && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5" /></div>
                <div className="bg-white border border-app-border rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {buildingProfile ? 'Building your profile…' : 'Thinking…'}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-app-border bg-white p-4">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={hasClaudeKey ? 'Type your answer…' : 'Add an AI API key in Settings to use onboarding'}
                disabled={!hasClaudeKey || sending || buildingProfile}
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button onClick={handleSend} disabled={!input.trim() || sending || !hasClaudeKey || buildingProfile} className="p-1.5 rounded-lg bg-brand text-white disabled:opacity-40 hover:bg-brand-dark transition-colors">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'preview' && profile && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="max-w-2xl space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">Profile ready to publish</p>
                <p className="text-xs text-green-600 mt-0.5">Review the details below and create the partner profile. You can edit everything after creation.</p>
              </div>
            </div>

            <div className="bg-white border border-app-border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-app-border">
                <p className="text-xs font-semibold text-gray-700">Generated Partner Profile</p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  ['Organization Name', profile.name],
                  ['Type', profile.type?.replace(/_/g, ' ')],
                  ['County', profile.county],
                  ['Address', profile.address],
                  ['Contact Email', profile.contactEmail],
                  ['Website', profile.website],
                ].map(([label, value]) => value ? (
                  <div key={label} className="grid grid-cols-3 gap-2 text-xs">
                    <span className="font-medium text-gray-600">{label}</span>
                    <span className="col-span-2 text-gray-900">{value}</span>
                  </div>
                ) : null)}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span className="font-medium text-gray-600">Grade Levels</span>
                  <span className="col-span-2 text-gray-900">{profile.gradeLevels?.join(', ') || '—'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span className="font-medium text-gray-600">Subjects</span>
                  <span className="col-span-2 text-gray-900">{profile.subjects?.join(', ') || '—'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span className="font-medium text-gray-600">Description</span>
                  <span className="col-span-2 text-gray-900 leading-relaxed">{profile.description}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCreatePartner} disabled={saving} className="flex items-center gap-1.5 px-5 py-2.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Partner Profile
              </button>
              <button onClick={handleReset} className="px-4 py-2.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'done' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Partner profile created!</h2>
            <p className="text-sm text-gray-500 mb-6">The organization is now listed on the Climate Learning Exchange. Teachers in their county will start seeing their programs in match results.</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleReset} className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition-colors">
                <Plus className="w-3.5 h-3.5" />Onboard Another Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
