'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Settings, Bell, Globe, Tag, Shield, ChevronRight, Check } from 'lucide-react'
import { getStoredTheme, setStoredTheme, type AppTheme } from '@/components/shared/ThemeProvider'
import { DEFAULT_WATCH_PROFILE } from '@/lib/settings/watch-profile'

const COMMODITIES = ['Carrageenan SRC', 'Carrageenan PRC', 'Agar Food Grade', 'Agar Technical', 'Sodium Alginate', 'Dried Nori', 'Spirulina', 'Chlorella']
const REGIONS = ['Global', 'Asia-Pacific', 'Europe', 'North America', 'Southeast Asia', 'Latin America', 'Africa']
const JURISDICTIONS = ['EU', 'FDA (US)', 'Codex Alimentarius', 'WTO', 'EFSA', 'China NMPA', 'Japan MHW']

export default function SettingsPage() {
  const { data: session } = useSession()
  const [watchedCommodities, setWatchedCommodities] = useState<string[]>(DEFAULT_WATCH_PROFILE.commodities)
  const [watchedRegions, setWatchedRegions] = useState<string[]>(DEFAULT_WATCH_PROFILE.regions)
  const [watchedJurisdictions, setWatchedJurisdictions] = useState<string[]>(DEFAULT_WATCH_PROFILE.jurisdictions)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [saved, setSaved] = useState(false)
  const [theme, setTheme] = useState<AppTheme>('Dark')

  useEffect(() => {
    setTheme(getStoredTheme())
    const localProfile = getLocalWatchProfile()
    if (localProfile) {
      setWatchedCommodities(localProfile.commodities)
      setWatchedRegions(localProfile.regions)
      setWatchedJurisdictions(localProfile.jurisdictions)
    }
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const profile = localProfile ?? d.watchProfile ?? DEFAULT_WATCH_PROFILE
        setWatchedCommodities(profile.commodities)
        setWatchedRegions(profile.regions)
        setWatchedJurisdictions(profile.jurisdictions)
        setEmailAlerts(d.preferences?.emailAlerts ?? true)
        setWeeklyDigest(d.preferences?.weeklyDigest ?? true)
        const nextTheme = d.preferences?.theme ?? getStoredTheme()
        setTheme(nextTheme)
        setStoredTheme(nextTheme)
      })
      .catch(() => {})
  }, [])

  function toggle<T>(arr: T[], setArr: (v: T[]) => void, item: T) {
    setArr(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
  }

  async function handleSave() {
    const watchProfile = {
      commodities: watchedCommodities,
      regions: watchedRegions,
      jurisdictions: watchedJurisdictions,
    }
    window.localStorage.setItem('bluebonzo-watch-profile', JSON.stringify(watchProfile))
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        watchProfile,
        preferences: {
          emailAlerts,
          weeklyDigest,
          theme,
        },
      }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tierColors: Record<string, string> = {
    community: 'text-muted-foreground bg-secondary border-border',
    professional: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    enterprise: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  }
  const tier = (session?.user as { tier?: string })?.tier ?? 'community'

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Account */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Account</h2>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <p className="font-medium text-sm">{session?.user?.name ?? 'Demo User'}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email ?? 'demo@bluebonzo.ai'}</p>
            </div>
            <div className={`ml-auto px-2 py-1 rounded-md border text-xs font-semibold capitalize ${tierColors[tier]}`}>
              {tier}
            </div>
          </div>
          <div className="pt-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center justify-between py-1">
              <span>Query limit</span>
              <span className="font-medium text-foreground">{tier === 'enterprise' ? 'Unlimited' : tier === 'professional' ? '500/mo' : '50/mo'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Report Bank storage</span>
              <span className="font-medium text-foreground">{tier === 'enterprise' ? '100 GB' : tier === 'professional' ? '10 GB' : '1 GB'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>API access</span>
              <span className="font-medium text-foreground">{tier === 'enterprise' ? 'Full' : tier === 'professional' ? 'Standard' : 'None'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Watch Profile */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Watch Profile</h2>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Commodities
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMODITIES.map(c => {
                const active = watchedCommodities.includes(c)
                return (
                  <button key={c} onClick={() => toggle(watchedCommodities, setWatchedCommodities, c)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-all ${active ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'}`}>
                    {active && <Check className="w-2.5 h-2.5" />}
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Regions
            </p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(r => {
                const active = watchedRegions.includes(r)
                return (
                  <button key={r} onClick={() => toggle(watchedRegions, setWatchedRegions, r)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-all ${active ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'}`}>
                    {active && <Check className="w-2.5 h-2.5" />}
                    {r}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" /> Regulatory Jurisdictions
            </p>
            <div className="flex flex-wrap gap-2">
              {JURISDICTIONS.map(j => {
                const active = watchedJurisdictions.includes(j)
                return (
                  <button key={j} onClick={() => toggle(watchedJurisdictions, setWatchedJurisdictions, j)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-all ${active ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-secondary border-border text-muted-foreground hover:border-amber-500/20 hover:text-foreground'}`}>
                    {active && <Check className="w-2.5 h-2.5" />}
                    {j}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Notifications</h2>
        </div>
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {[
            { label: 'Email Regulatory Alerts', desc: 'Get notified when new regulations affect your watched commodities', state: emailAlerts, toggle: setEmailAlerts },
            { label: 'Weekly Market Digest', desc: 'Summary of price movements and market developments every Monday', state: weeklyDigest, toggle: setWeeklyDigest },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{item.desc}</p>
              </div>
              <button
                onClick={() => item.toggle(!item.state)}
                className={`relative w-10 h-5 rounded-full transition-all ${item.state ? 'bg-primary' : 'bg-secondary border border-border'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.state ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Appearance */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Appearance</h2>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground mt-0.5">Choose the display mode for your workspace</p>
            </div>
            <div className="flex rounded-lg bg-secondary p-0.5 text-xs">
              {(['Dark', 'Light', 'System'] as AppTheme[]).map(t => (
                <button
                  key={t}
                  onClick={() => {
                    setTheme(t)
                    setStoredTheme(t)
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all ${t === theme ? 'bg-card text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${saved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved</> : <>Save preferences <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  )
}

function getLocalWatchProfile() {
  try {
    const raw = window.localStorage.getItem('bluebonzo-watch-profile')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.commodities) || !Array.isArray(parsed.regions) || !Array.isArray(parsed.jurisdictions)) return null
    return parsed as typeof DEFAULT_WATCH_PROFILE
  } catch {
    return null
  }
}
