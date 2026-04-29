'use client'
import { useState, useEffect, useRef } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Database, Upload, RefreshCw, CheckCircle, AlertCircle, Sparkles, Trash2, Mail, Download, Map } from 'lucide-react'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app.store'

type ImportStep = 'select' | 'map' | 'importing' | 'done'
type ImportEntity = 'partners' | 'programs' | 'teachers' | 'schools' | 'districts'

const ENTITY_FIELDS: Record<ImportEntity, { key: string; label: string }[]> = {
  partners: [{ key: 'name', label: 'Name *' }, { key: 'type', label: 'Type' }, { key: 'description', label: 'Description' }, { key: 'address', label: 'Address' }, { key: 'lat', label: 'Latitude' }, { key: 'lng', label: 'Longitude' }, { key: 'county', label: 'County' }, { key: 'contact_email', label: 'Email' }, { key: 'website', label: 'Website' }, { key: 'status', label: 'Status' }],
  programs: [{ key: 'partner_id', label: 'Partner ID *' }, { key: 'title', label: 'Title *' }, { key: 'description', label: 'Description' }, { key: 'grade_levels', label: 'Grade Levels (JSON)' }, { key: 'subjects', label: 'Subjects (JSON)' }, { key: 'cost', label: 'Cost' }, { key: 'max_students', label: 'Max Students' }, { key: 'season', label: 'Season (JSON)' }, { key: 'lat', label: 'Latitude' }, { key: 'lng', label: 'Longitude' }],
  teachers: [{ key: 'name', label: 'Name *' }, { key: 'email', label: 'Email' }, { key: 'school_id', label: 'School ID' }, { key: 'grade_levels', label: 'Grade Levels (JSON)' }, { key: 'subjects', label: 'Subjects (JSON)' }, { key: 'lat', label: 'Latitude' }, { key: 'lng', label: 'Longitude' }, { key: 'zip', label: 'Zip Code' }],
  schools: [{ key: 'name', label: 'Name *' }, { key: 'district_id', label: 'District ID' }, { key: 'address', label: 'Address' }, { key: 'city', label: 'City' }, { key: 'county', label: 'County' }, { key: 'lat', label: 'Latitude' }, { key: 'lng', label: 'Longitude' }, { key: 'enrollment', label: 'Enrollment' }, { key: 'title1_flag', label: 'Title I (true/false)' }],
  districts: [{ key: 'name', label: 'Name *' }, { key: 'county', label: 'County' }, { key: 'superintendent_email', label: 'Supt. Email' }, { key: 'enrollment_total', label: 'Total Enrollment' }]
}

interface EquityRow { county: string; programs: number; schools: number; enrollment: number; title1Pct: number; programsPerSchool: number; burden: number; isRural: boolean; priority: number }

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'demo' | 'import' | 'database' | 'digests' | 'equity'>('demo')
  const { setActiveTeacher } = useAppStore()

  const [demoLoaded, setDemoLoaded] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [clearingDemo, setClearingDemo] = useState(false)
  const [demoResult, setDemoResult] = useState<Record<string, number> | null>(null)

  useEffect(() => { invoke<boolean>('admin:isDemoLoaded').then(setDemoLoaded).catch(() => {}) }, [])

  const handleLoadDemo = async () => {
    setLoadingDemo(true); setDemoResult(null)
    try {
      const result = await invoke<{ inserted: Record<string, number> }>('admin:seedDemo')
      setDemoResult(result.inserted); setDemoLoaded(true)
      toast.success('Demo data loaded — Maria Chen is now the active teacher')
      const teacher = await invoke<any>('teacher:getActive').catch(() => null)
      if (teacher) setActiveTeacher(teacher)
    } catch (err: any) { toast.error('Failed to load demo data: ' + err.message) }
    finally { setLoadingDemo(false) }
  }

  const handleClearDemo = async () => {
    if (!confirm('This will permanently delete ALL data in the database. Are you sure?')) return
    setClearingDemo(true)
    try { await invoke('admin:clearDemo'); setDemoLoaded(false); setDemoResult(null); setActiveTeacher(null); toast.success('All data cleared') }
    catch (err: any) { toast.error('Failed to clear data: ' + err.message) }
    finally { setClearingDemo(false) }
  }

  // Digests — per-teacher sequential calls to avoid serverless timeout
  const [generatingDigests, setGeneratingDigests] = useState(false)
  const [digestProgress, setDigestProgress] = useState<{ done: number; total: number; current: string }>({ done: 0, total: 0, current: '' })
  const [digestResults, setDigestResults] = useState<{ name: string; success: boolean }[] | null>(null)

  const handleGenerateDigests = async () => {
    setGeneratingDigests(true); setDigestResults(null)
    try {
      const teachers = await invoke<{ id: string; name: string }[]>('teacher:list')
      if (!teachers.length) { toast.error('No teachers found'); return }
      setDigestProgress({ done: 0, total: teachers.length, current: teachers[0]?.name ?? '' })
      const results: { name: string; success: boolean }[] = []
      for (let i = 0; i < teachers.length; i++) {
        const t = teachers[i]
        setDigestProgress({ done: i, total: teachers.length, current: t.name })
        try {
          const digest = await invoke<string | null>('ai:generateDigest', { teacherId: t.id })
          results.push({ name: t.name, success: !!digest })
        } catch {
          results.push({ name: t.name, success: false })
        }
      }
      setDigestResults(results)
      setDigestProgress({ done: teachers.length, total: teachers.length, current: '' })
      const succeeded = results.filter((r) => r.success).length
      toast.success(`Generated ${succeeded} of ${results.length} digests`)
    } catch (err: any) { toast.error('Failed: ' + err.message) }
    finally { setGeneratingDigests(false) }
  }

  const handleExportCSV = async (entity: 'programs' | 'partners') => {
    try {
      const data = await invoke<any[]>(entity === 'programs' ? 'program:list' : 'partner:list')
      if (!data.length) { toast.error('No data to export'); return }
      const headers = Object.keys(data[0])
      const rows = data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${entity}-${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${data.length} ${entity}`)
    } catch { toast.error('Export failed') }
  }

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [entity, setEntity] = useState<ImportEntity>('partners')
  const [step, setStep] = useState<ImportStep>('select')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMap, setColumnMap] = useState<Record<string, string>>({})
  const [importResult, setImportResult] = useState<any>(null)

  const [dbStats, setDbStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Equity
  const [equityData, setEquityData] = useState<EquityRow[]>([])
  const [loadingEquity, setLoadingEquity] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('action', 'preview')
    const res = await fetch('/api/import/upload', { method: 'POST', body: formData })
    const { headers } = await res.json()
    setCsvHeaders(headers)

    const autoMap: Record<string, string> = {}
    const fields = ENTITY_FIELDS[entity]
    for (const header of headers) {
      const match = fields.find((f) => f.key === header.toLowerCase().replace(/ /g, '_') || f.key === header.toLowerCase())
      if (match) autoMap[header] = match.key
    }
    setColumnMap(autoMap)
    setStep('map')
  }

  const handleRunImport = async () => {
    if (!csvFile) return
    setStep('importing')
    try {
      const formData = new FormData()
      formData.append('file', csvFile)
      formData.append('action', 'import')
      formData.append('entity', entity)
      formData.append('columnMap', JSON.stringify(columnMap))
      const res = await fetch('/api/import/upload', { method: 'POST', body: formData })
      const result = await res.json()
      setImportResult(result); setStep('done')
      toast.success(`Import complete: ${result.inserted} inserted`)
    } catch (err: any) { toast.error('Import failed: ' + err.message); setStep('map') }
  }

  const resetImport = () => { setStep('select'); setCsvFile(null); setCsvHeaders([]); setColumnMap({}); setImportResult(null); if (fileInputRef.current) fileInputRef.current.value = '' }

  const loadDbStats = async () => { setLoadingStats(true); try { const stats = await invoke('admin:dbStats'); setDbStats(stats) } finally { setLoadingStats(false) } }
  useEffect(() => { if (activeTab === 'database') loadDbStats() }, [activeTab])

  const loadEquity = async () => { setLoadingEquity(true); try { const data = await invoke<EquityRow[]>('insights:equityCoverage'); setEquityData(data) } finally { setLoadingEquity(false) } }
  useEffect(() => { if (activeTab === 'equity') loadEquity() }, [activeTab])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Admin" />
      <div className="flex border-b border-app-border bg-white px-6 overflow-x-auto">
        {([['demo', 'Demo Data', Sparkles], ['import', 'CSV Import', Upload], ['database', 'Database', Database], ['digests', 'Digests & Export', Mail], ['equity', 'Equity Map', Map]] as const).map(([tab, label, Icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {activeTab === 'demo' && (
          <div className="max-w-2xl space-y-5">
            <div><h3 className="text-sm font-semibold text-gray-900 mb-1">Demo Data</h3><p className="text-xs text-gray-500 leading-relaxed">Load realistic California environmental education data to explore all features. Includes 10 partners, 17 programs, 12 teachers, 4 schools, bookmarks, and engagements.</p></div>
            {demoLoaded && !demoResult && <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>Database already contains data. Loading demo data will replace the current demo dataset.</span></div>}

            <div className="border border-app-border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 border-b border-app-border">What's included</div>
              <div className="divide-y divide-app-border">
                {[['3 school districts', 'Santa Cruz City Schools, OUSD, LAUSD'], ['4 schools', 'Gault Elementary, Branciforte Middle, Fruitvale Elementary, Marina del Rey Middle'], ['12 teachers', 'Coverage across TK-12, counties, grade bands, and subject interests'], ['10 community partners', 'Elkhorn Slough, Pie Ranch, UCSC Farm, Point Reyes, TreePeople, and more'], ['17 programs', 'Across wetlands, agriculture, urban ecology, and climate justice themes'], ['Bookmarks & engagements', 'To demonstrate engagement tracking and match scoring']].map(([title, desc]) => (
                  <div key={title} className="px-4 py-2.5 grid grid-cols-5 gap-4 text-xs"><span className="col-span-2 font-medium text-gray-800">{title}</span><span className="col-span-3 text-gray-500">{desc}</span></div>
                ))}
              </div>
            </div>

            {demoResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-700"><CheckCircle className="w-4 h-4" />Demo data loaded</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(demoResult).map(([table, count]: [string, any]) => (
                    <div key={table} className="bg-green-50 border border-green-100 rounded-lg p-2.5 text-center"><p className="text-lg font-bold text-green-700">{count}</p><p className="text-[10px] text-gray-500 mt-0.5">{table}</p></div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={handleLoadDemo} disabled={loadingDemo} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors">
                {loadingDemo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}{loadingDemo ? 'Loading...' : 'Load Demo Data'}
              </button>
              <button onClick={handleClearDemo} disabled={clearingDemo} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors border border-red-200">
                {clearingDemo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}Clear All Data
              </button>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="max-w-2xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Import Data via CSV</h3>
            {step === 'select' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Entity Type</label>
                  <select value={entity} onChange={(e) => setEntity(e.target.value as ImportEntity)} className="text-xs border border-app-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand bg-white">
                    <option value="partners">Partners</option><option value="programs">Programs</option><option value="teachers">Teachers</option><option value="schools">Schools</option><option value="districts">Districts</option>
                  </select>
                </div>
                <label className="block border-2 border-dashed border-app-border rounded-xl p-8 text-center cursor-pointer hover:border-brand hover:bg-brand-light/20 transition-colors">
                  <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Click to select CSV file</p>
                  <p className="text-xs text-gray-400 mt-1">CSV with headers in first row</p>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                </label>
              </div>
            )}

            {step === 'map' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700">Map CSV columns to {entity} fields</p>
                  <button onClick={resetImport} className="text-xs text-gray-400 hover:text-brand">← Back</button>
                </div>
                <div className="border border-app-border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 grid grid-cols-2 gap-4 text-xs font-medium text-gray-500 border-b border-app-border"><span>CSV Column</span><span>Map to field</span></div>
                  {csvHeaders.map((header) => (
                    <div key={header} className="px-4 py-2 grid grid-cols-2 gap-4 text-xs border-b border-app-border last:border-0 items-center">
                      <span className="font-medium text-gray-700">{header}</span>
                      <select value={columnMap[header] ?? ''} onChange={(e) => setColumnMap((prev) => ({ ...prev, [header]: e.target.value }))} className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand">
                        <option value="">— skip —</option>
                        {ENTITY_FIELDS[entity].map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <button onClick={handleRunImport} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors">
                  <Upload className="w-3.5 h-3.5" />Run Import
                </button>
              </div>
            )}

            {step === 'importing' && <div className="text-center py-8"><RefreshCw className="w-8 h-8 text-brand mx-auto mb-3 animate-spin" /><p className="text-sm font-medium text-gray-700">Importing...</p></div>}

            {step === 'done' && importResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><CheckCircle className="w-5 h-5 text-green-500" />Import Complete</div>
                <div className="grid grid-cols-3 gap-3">
                  <StatBox label="Inserted" value={importResult.inserted} color="green" />
                  <StatBox label="Skipped" value={importResult.skipped} color="yellow" />
                  <StatBox label="Errors" value={importResult.errors?.length ?? 0} color="red" />
                </div>
                {importResult.errors?.length > 0 && (
                  <div className="text-xs text-red-600 bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 5).map((e: string, i: number) => <p key={i}>{e}</p>)}
                    {importResult.errors.length > 5 && <p>...and {importResult.errors.length - 5} more</p>}
                  </div>
                )}
                <button onClick={resetImport} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">Import Another File</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'database' && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Database Health</h3>
              <button onClick={loadDbStats} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand"><RefreshCw className={`w-3 h-3 ${loadingStats ? 'animate-spin' : ''}`} />Refresh</button>
            </div>
            {dbStats && (
              <>
                <div className="border border-app-border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 grid grid-cols-2 text-xs font-medium text-gray-500 border-b border-app-border"><span>Table</span><span>Rows</span></div>
                  {Object.entries(dbStats.counts).map(([table, count]: [string, any]) => (
                    <div key={table} className="px-4 py-2.5 grid grid-cols-2 text-xs border-b border-app-border last:border-0">
                      <span className="font-mono text-gray-600">{table}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
                <button onClick={async () => { await invoke('admin:vacuum'); toast.success('VACUUM complete'); loadDbStats() }} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  <Database className="w-3.5 h-3.5" />Run VACUUM
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'equity' && (
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Equity & Coverage Map</h3>
                <p className="text-xs text-gray-500 mt-0.5">County-level coverage gaps scored against CalEnviroScreen burden, Title I school density, and rural access. Higher priority = more underserved.</p>
              </div>
              <button onClick={loadEquity} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand"><RefreshCw className={`w-3 h-3 ${loadingEquity ? 'animate-spin' : ''}`} />Refresh</button>
            </div>

            {loadingEquity ? (
              <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : equityData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No school or partner data available yet — load demo data or import schools.</p>
            ) : (
              <>
                {/* Priority legend */}
                <div className="flex items-center gap-4 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />High priority (70+)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />Medium (45–69)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />Lower priority (&lt;45)</span>
                </div>

                <div className="border border-app-border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 grid grid-cols-7 gap-2 text-[10px] font-semibold text-gray-500 border-b border-app-border">
                    <span className="col-span-2">County</span>
                    <span>Programs</span>
                    <span>Schools</span>
                    <span>Title I %</span>
                    <span>Burden</span>
                    <span>Priority</span>
                  </div>
                  {equityData.slice(0, 30).map((row) => {
                    const priorityColor = row.priority >= 70 ? 'bg-red-400' : row.priority >= 45 ? 'bg-amber-400' : 'bg-green-400'
                    return (
                      <div key={row.county} className="px-4 py-2.5 grid grid-cols-7 gap-2 text-xs border-b border-gray-50 last:border-0 items-center hover:bg-gray-50">
                        <div className="col-span-2 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-sm shrink-0 ${priorityColor}`} />
                          <span className="font-medium text-gray-800">{row.county}</span>
                          {row.isRural && <span className="text-[9px] text-blue-500 bg-blue-50 px-1 rounded">rural</span>}
                        </div>
                        <span className="text-gray-600">{row.programs}</span>
                        <span className="text-gray-600">{row.schools}</span>
                        <span className={`font-medium ${row.title1Pct >= 60 ? 'text-red-600' : row.title1Pct >= 30 ? 'text-amber-600' : 'text-gray-600'}`}>{row.title1Pct}%</span>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 bg-gray-100 rounded-full h-1">
                            <div className="h-1 bg-orange-400 rounded-full" style={{ width: `${Math.min(100, row.burden)}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 w-5 text-right">{row.burden}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${priorityColor}`} style={{ width: `${Math.min(100, row.priority)}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-700 w-6 text-right">{row.priority}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Priority score = 35% CalEnviroScreen burden + 30% Title I school % + 25% program coverage gap + 10% rural bonus.
                  CalEnviroScreen data based on California OEHHA public estimates. Use this table to feed targeting priorities into the Intelligent Prospector.
                </p>
              </>
            )}
          </div>
        )}

        {activeTab === 'digests' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Monthly Digest Generation</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Generate personalized monthly digest emails for all teachers. Each digest summarises nearby programs matching the teacher's profile. Requires a Claude or OpenAI API key configured in Settings.</p>
            </div>
            <div>
              <button onClick={handleGenerateDigests} disabled={generatingDigests} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors">
                {generatingDigests ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                {generatingDigests ? `Generating… (${digestProgress.done}/${digestProgress.total})` : 'Generate All Digests'}
              </button>
            </div>
            {generatingDigests && digestProgress.total > 0 && (
              <div className="space-y-2">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 bg-brand rounded-full transition-all" style={{ width: `${Math.round((digestProgress.done / digestProgress.total) * 100)}%` }} />
                </div>
                <p className="text-xs text-gray-500">Processing: {digestProgress.current} ({digestProgress.done}/{digestProgress.total})</p>
              </div>
            )}
            {digestResults && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-green-50 rounded-xl px-4 py-2 text-center">
                    <p className="text-xl font-bold text-green-700">{digestResults.filter((r) => r.success).length}</p>
                    <p className="text-[10px] text-gray-500">Generated</p>
                  </div>
                  <div className="bg-red-50 rounded-xl px-4 py-2 text-center">
                    <p className="text-xl font-bold text-red-700">{digestResults.filter((r) => !r.success).length}</p>
                    <p className="text-[10px] text-gray-500">Failed</p>
                  </div>
                </div>
                {digestResults.filter((r) => !r.success).length > 0 && (
                  <div className="text-xs text-red-600 bg-red-50 rounded-lg p-3 space-y-1">
                    <p className="font-medium">Failed teachers (check AI API key in Settings):</p>
                    {digestResults.filter((r) => !r.success).map((r) => <p key={r.name}>· {r.name}</p>)}
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-app-border pt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Export Data</h3>
              <p className="text-xs text-gray-500 mb-4">Download current data as CSV files for offline analysis or reporting.</p>
              <div className="flex items-center gap-3">
                <button onClick={() => handleExportCSV('programs')} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  <Download className="w-3.5 h-3.5" />Export Programs CSV
                </button>
                <button onClick={() => handleExportCSV('partners')} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  <Download className="w-3.5 h-3.5" />Export Partners CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const bg = color === 'green' ? 'bg-green-50' : color === 'yellow' ? 'bg-yellow-50' : 'bg-red-50'
  const text = color === 'green' ? 'text-green-700' : color === 'yellow' ? 'text-yellow-700' : 'text-red-700'
  return <div className={`${bg} rounded-xl p-3 text-center`}><p className={`text-xl font-bold ${text}`}>{value}</p><p className="text-xs text-gray-500 mt-0.5">{label}</p></div>
}
