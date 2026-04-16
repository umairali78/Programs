import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { invoke } from '../../lib/api'

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])
  const load = async () => {
    setLoading(true)
    try { setSettings(await invoke<Record<string, string>>('settings:getAll')) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    await invoke('settings:setBulk', settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const field = (key: string, label: string, type = 'text', options?: string[]) => (
    <div key={key}>
      <label className="text-sm font-medium text-dark/70 mb-1.5 block">{label}</label>
      {options ? (
        <select value={settings[key] ?? ''} onChange={(e) => setSettings({...settings, [key]: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={settings[key] ?? ''} onChange={(e) => setSettings({...settings, [key]: e.target.value})} className="w-full border border-app-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
      )}
    </div>
  )

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-2xl space-y-6">
      {/* Business */}
      <div className="bg-white rounded-card border border-app-border p-6">
        <h3 className="font-semibold text-dark mb-4">Business Profile</h3>
        <div className="space-y-4">
          {field('business_name', 'Business Name')}
          {field('business_phone', 'Phone')}
          {field('business_email', 'Email', 'email')}
          {field('business_address', 'Address')}
          {field('business_city', 'City')}
        </div>
      </div>

      {/* Financial */}
      <div className="bg-white rounded-card border border-app-border p-6">
        <h3 className="font-semibold text-dark mb-4">Financial Settings</h3>
        <div className="space-y-4">
          {field('currency', 'Currency', 'text', ['PKR', 'USD', 'GBP', 'AED'])}
          {field('tax_rate', 'Default Tax Rate (%)', 'number')}
          {field('invoice_prefix', 'Invoice Prefix')}
          {field('invoice_footer_note', 'Invoice Footer Note')}
        </div>
      </div>

      {/* Loyalty */}
      <div className="bg-white rounded-card border border-app-border p-6">
        <h3 className="font-semibold text-dark mb-4">Loyalty Programme</h3>
        <div className="space-y-4">
          {field('loyalty_points_per_100', 'Points per PKR 100 spent', 'number')}
          {field('loyalty_points_to_pkr', 'PKR value per point', 'number')}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-card border border-app-border p-6">
        <h3 className="font-semibold text-dark mb-4">Notification Settings</h3>
        <div className="space-y-4">
          {field('low_stock_threshold_global', 'Global Low Stock Threshold', 'number')}
          {field('deadline_warning_days', 'Deadline Warning (days)', 'number')}
        </div>
      </div>

      <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-600' : 'bg-brand'} text-white hover:opacity-90`}>
        <Save size={16} /> {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
