import { useState } from 'react'
import { Download, Upload, HardDrive, Wand2, Sparkles } from 'lucide-react'
import { invoke } from '../../lib/api'

export function DataManagementPage() {
  const [backing, setBacking] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [backupPath, setBackupPath] = useState('')
  const [message, setMessage] = useState('')

  const handleBackup = async () => {
    setBacking(true)
    setMessage('')
    try {
      const path = await invoke<string>('backup:createBackup', {})
      setBackupPath(path)
      setMessage(`Backup created: ${path}`)
    } catch (e: any) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setBacking(false)
    }
  }

  const handleSeedDemo = async () => {
    setSeeding(true)
    setMessage('')
    try {
      const result = await invoke<{ message: string }>('demo:seedData')
      setMessage(result.message)
    } catch (e: any) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="bg-white rounded-card border border-app-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#fff1e8] rounded-lg flex items-center justify-center">
            <Sparkles size={20} className="text-[#9f2d21]" />
          </div>
          <div>
            <h3 className="font-semibold text-dark">Seed Demo Data</h3>
            <p className="text-sm text-dark/50">Create a polished showcase with vendors, customers, products, work orders, and sample garment images.</p>
          </div>
        </div>
        <button
          onClick={handleSeedDemo}
          disabled={seeding}
          className="w-full flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-60"
        >
          <Wand2 size={16} /> {seeding ? 'Creating Demo Showcase...' : 'Generate Demo Showcase'}
        </button>
        <p className="text-xs text-dark/40 mt-3">
          This is safe to run once per workspace. If demo data is already present, the app will simply tell you.
        </p>
      </div>

      <div className="bg-white rounded-card border border-app-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center"><HardDrive size={20} className="text-brand" /></div>
          <div><h3 className="font-semibold text-dark">Database Backup</h3><p className="text-sm text-dark/50">Save a complete backup of your data</p></div>
        </div>
        <button onClick={handleBackup} disabled={backing} className="w-full flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-60">
          <Download size={16} /> {backing ? 'Creating Backup...' : 'Create Backup'}
        </button>
        {message && <p className="text-sm mt-3 text-dark/60 break-all">{message}</p>}
      </div>

      <div className="bg-white rounded-card border border-app-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><Upload size={20} className="text-amber-600" /></div>
          <div><h3 className="font-semibold text-dark">Restore Backup</h3><p className="text-sm text-dark/50">A backup will be created before restoring</p></div>
        </div>
        <div className="text-sm text-dark/50 bg-amber-50 border border-amber-100 rounded-lg p-3">
          ⚠️ Restoring will replace all current data. A backup of the current state will be created automatically before restoration.
        </div>
        <input
          type="text"
          placeholder="Enter path to backup .zip file..."
          className="w-full mt-3 border border-app-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              const path = (e.target as HTMLInputElement).value.trim()
              if (!path) return
              try {
                await invoke('backup:restoreBackup', { zipPath: path })
                alert('Restore successful. Please restart the application.')
              } catch (err: any) {
                alert(`Restore failed: ${err.message}`)
              }
            }
          }}
        />
        <p className="text-xs text-dark/30 mt-1">Press Enter to restore from the path above</p>
      </div>
    </div>
  )
}
