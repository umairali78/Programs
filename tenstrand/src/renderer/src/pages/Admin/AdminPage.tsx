import { useState, useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Database, Upload, RefreshCw, Download, CheckCircle, AlertCircle, Sparkles, Trash2 } from 'lucide-react'
import { invoke, subscribe } from '@/lib/api'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app.store'

type ImportStep = 'select' | 'map' | 'importing' | 'done'
type ImportEntity = 'partners' | 'programs' | 'teachers' | 'schools' | 'districts'

const ENTITY_FIELDS: Record<ImportEntity, { key: string; label: string }[]> = {
  partners: [
    { key: 'name', label: 'Name *' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'address', label: 'Address' },
    { key: 'lat', label: 'Latitude' },
    { key: 'lng', label: 'Longitude' },
    { key: 'county', label: 'County' },
    { key: 'contact_email', label: 'Email' },
    { key: 'website', label: 'Website' },
    { key: 'status', label: 'Status' }
  ],
  programs: [
    { key: 'partner_id', label: 'Partner ID *' },
    { key: 'title', label: 'Title *' },
    { key: 'description', label: 'Description' },
    { key: 'grade_levels', label: 'Grade Levels (JSON)' },
    { key: 'subjects', label: 'Subjects (JSON)' },
    { key: 'cost', label: 'Cost' },
    { key: 'max_students', label: 'Max Students' },
    { key: 'season', label: 'Season (JSON)' },
    { key: 'lat', label: 'Latitude' },
    { key: 'lng', label: 'Longitude' }
  ],
  teachers: [
    { key: 'name', label: 'Name *' },
    { key: 'email', label: 'Email' },
    { key: 'school_id', label: 'School ID' },
    { key: 'grade_levels', label: 'Grade Levels (JSON)' },
    { key: 'subjects', label: 'Subjects (JSON)' },
    { key: 'lat', label: 'Latitude' },
    { key: 'lng', label: 'Longitude' },
    { key: 'zip', label: 'Zip Code' }
  ],
  schools: [
    { key: 'name', label: 'Name *' },
    { key: 'district_id', label: 'District ID' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'county', label: 'County' },
    { key: 'lat', label: 'Latitude' },
    { key: 'lng', label: 'Longitude' },
    { key: 'enrollment', label: 'Enrollment' },
    { key: 'title1_flag', label: 'Title I (true/false)' }
  ],
  districts: [
    { key: 'name', label: 'Name *' },
    { key: 'county', label: 'County' },
    { key: 'superintendent_email', label: 'Supt. Email' },
    { key: 'enrollment_total', label: 'Total Enrollment' }
  ]
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'demo' | 'import' | 'database'>('demo')
  const { setActiveTeacher } = useAppStore()

  // Demo data state
  const [demoLoaded, setDemoLoaded] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [clearingDemo, setClearingDemo] = useState(false)
  const [demoResult, setDemoResult] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    invoke<boolean>('admin:isDemoLoaded').then(setDemoLoaded).catch(() => {})
  }, [])

  const handleLoadDemo = async () => {
    setLoadingDemo(true)
    setDemoResult(null)
    try {
      const result = await invoke<{ inserted: Record<string, number> }>('admin:seedDemo')
      setDemoResult(result.inserted)
      setDemoLoaded(true)
      toast.success('Demo data loaded — Maria Chen is now the active teacher')
      // Re-load active teacher in app state
      const teacher = await invoke<any>('teacher:getActive').catch(() => null)
      if (teacher) setActiveTeacher(teacher)
    } catch (err: any) {
      toast.error('Failed to load demo data: ' + err.message)
    } finally {
      setLoadingDemo(false)
    }
  }

  const handleClearDemo = async () => {
    if (!confirm('This will permanently delete ALL data in the database. Are you sure?')) return
    setClearingDemo(true)
    try {
      await invoke('admin:clearDemo')
      setDemoLoaded(false)
      setDemoResult(null)
      setActiveTeacher(null)
      toast.success('All data cleared')
    } catch (err: any) {
      toast.error('Failed to clear data: ' + err.message)
    } finally {
      setClearingDemo(false)
    }
  }

  // Import state
  const [entity, setEntity] = useState<ImportEntity>('partners')
  const [step, setStep] = useState<ImportStep>('select')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [columnMap, setColumnMap] = useState<Record<string, string>>({})
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0 })
  const [importResult, setImportResult] = useState<any>(null)

  // DB stats
  const [dbStats, setDbStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    const unsub = subscribe('import:progress', (data: any) => {
      setImportProgress({ processed: data.processed, total: data.total })
    })
    return unsub
  }, [])

  const handleSelectFile = async () => {
    const path = await invoke<string | null>('import:selectFile')
    if (!path) return
    setFilePath(path)

    const { headers, rows } = await invoke('import:parsePreview', { filePath: path })
    setCsvHeaders(headers)
    setPreviewRows(rows)

    // Auto-map columns with matching names
    const autoMap: Record<string, string> = {}
    const fields = ENTITY_FIELDS[entity]
    for (const header of headers) {
      const match = fields.find(
        (f) =>
          f.key === header.toLowerCase().replace(/ /g, '_') ||
          f.key === header.toLowerCase()
      )
      if (match) autoMap[header] = match.key
    }
    setColumnMap(autoMap)
    setStep('map')
  }

  const handleRunImport = async () => {
    if (!filePath) return
    setStep('importing')
    setImportProgress({ processed: 0, total: 0 })

    try {
      const result = await invoke('import:run', { filePath, entity, columnMap })
      setImportResult(result)
      setStep('done')
      toast.success(`Import complete: ${result.inserted} inserted`)
    } catch (err: any) {
      toast.error('Import failed: ' + err.message)
      setStep('map')
    }
  }

  const resetImport = () => {
    setStep('select')
    setFilePath(null)
    setCsvHeaders([])
    setPreviewRows([])
    setColumnMap({})
    setImportResult(null)
  }

  const loadDbStats = async () => {
    setLoadingStats(true)
    try {
      const stats = await invoke('admin:dbStats')
      setDbStats(stats)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'database') loadDbStats()
  }, [activeTab])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Admin" />

      {/* Tabs */}
      <div className="flex border-b border-app-border bg-white px-6">
        {([['demo', 'Demo Data', Sparkles], ['import', 'CSV Import', Upload], ['database', 'Database', Database]] as const).map(
          ([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          )
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {activeTab === 'demo' && (
          <div className="max-w-2xl space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Demo Data</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Load realistic California environmental education data to explore all features.
                Includes 10 partners, 17 programs, 3 teachers, 4 schools, and sample reviews.
              </p>
            </div>

            {demoLoaded && !demoResult && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Database already contains data. Loading demo data will add to existing records.</span>
              </div>
            )}

            {/* What's included */}
            <div className="border border-app-border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 border-b border-app-border">
                What's included
              </div>
              <div className="divide-y divide-app-border">
                {[
                  ['3 school districts', 'Santa Cruz City Schools, OUSD, LAUSD'],
                  ['4 schools', 'Gault Elementary, Branciforte Middle, Fruitvale Elementary, Marina del Rey Middle'],
                  ['3 teachers', 'Maria Chen (3–5 Science), James Rodriguez (6–8 Climate), Sarah Kim (K–2 Life Science)'],
                  ['10 community partners', 'Elkhorn Slough, Pie Ranch, UCSC Farm, Point Reyes, TreePeople, and more'],
                  ['17 programs', 'Across wetlands, agriculture, urban ecology, and climate justice themes'],
                  ['Sample reviews & bookmarks', 'To demonstrate engagement tracking and match scoring'],
                ].map(([title, desc]) => (
                  <div key={title} className="px-4 py-2.5 grid grid-cols-5 gap-4 text-xs">
                    <span className="col-span-2 font-medium text-gray-800">{title}</span>
                    <span className="col-span-3 text-gray-500">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {demoResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Demo data loaded
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(demoResult).map(([table, count]) => (
                    <div key={table} className="bg-green-50 border border-green-100 rounded-lg p-2.5 text-center">
                      <p className="text-lg font-bold text-green-700">{count}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{table}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Active teacher set to Maria Chen. Go to the Map page to see matched programs.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleLoadDemo}
                disabled={loadingDemo}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
              >
                {loadingDemo ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {loadingDemo ? 'Loading...' : 'Load Demo Data'}
              </button>

              <button
                onClick={handleClearDemo}
                disabled={clearingDemo}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors border border-red-200"
              >
                {clearingDemo ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Clear All Data
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
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">
                    Entity Type
                  </label>
                  <select
                    value={entity}
                    onChange={(e) => setEntity(e.target.value as ImportEntity)}
                    className="text-xs border border-app-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                  >
                    <option value="partners">Partners</option>
                    <option value="programs">Programs</option>
                    <option value="teachers">Teachers</option>
                    <option value="schools">Schools</option>
                    <option value="districts">Districts</option>
                  </select>
                </div>

                <div
                  onClick={handleSelectFile}
                  className="border-2 border-dashed border-app-border rounded-xl p-8 text-center cursor-pointer hover:border-brand hover:bg-brand-light/20 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Click to select CSV file</p>
                  <p className="text-xs text-gray-400 mt-1">CSV with headers in first row</p>
                </div>
              </div>
            )}

            {step === 'map' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700">
                    Map CSV columns to {entity} fields
                  </p>
                  <button onClick={resetImport} className="text-xs text-gray-400 hover:text-brand">
                    ← Back
                  </button>
                </div>

                <div className="border border-app-border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 grid grid-cols-2 gap-4 text-xs font-medium text-gray-500 border-b border-app-border">
                    <span>CSV Column</span>
                    <span>Map to field</span>
                  </div>
                  {csvHeaders.map((header) => (
                    <div
                      key={header}
                      className="px-4 py-2 grid grid-cols-2 gap-4 text-xs border-b border-app-border last:border-0 items-center"
                    >
                      <span className="font-medium text-gray-700">{header}</span>
                      <select
                        value={columnMap[header] ?? ''}
                        onChange={(e) =>
                          setColumnMap((prev) => ({ ...prev, [header]: e.target.value }))
                        }
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand"
                      >
                        <option value="">— skip —</option>
                        {ENTITY_FIELDS[entity].map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRunImport}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Run Import
                </button>
              </div>
            )}

            {step === 'importing' && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-brand mx-auto mb-3 animate-spin" />
                <p className="text-sm font-medium text-gray-700">Importing...</p>
                <p className="text-xs text-gray-400 mt-1">
                  {importProgress.processed} rows processed
                </p>
              </div>
            )}

            {step === 'done' && importResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Import Complete
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <StatBox label="Inserted" value={importResult.inserted} color="green" />
                  <StatBox label="Skipped" value={importResult.skipped} color="yellow" />
                  <StatBox label="Errors" value={importResult.errors?.length ?? 0} color="red" />
                </div>
                {importResult.errors?.length > 0 && (
                  <div className="text-xs text-red-600 bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 5).map((e: string, i: number) => (
                      <p key={i}>{e}</p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p>...and {importResult.errors.length - 5} more</p>
                    )}
                  </div>
                )}
                <button
                  onClick={resetImport}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Import Another File
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'database' && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Database Health</h3>
              <div className="flex gap-2">
                <button
                  onClick={loadDbStats}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingStats ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => invoke('admin:exportDb').then(() => toast.success('Database exported'))}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Export .db
                </button>
              </div>
            </div>

            {dbStats && (
              <>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                  <span className="font-medium">Database path: </span>
                  <span className="font-mono">{dbStats.dbPath}</span>
                  <span className="ml-3 font-medium">
                    Size: {(dbStats.fileSizeBytes / 1024).toFixed(1)} KB
                  </span>
                </div>

                <div className="border border-app-border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 grid grid-cols-2 text-xs font-medium text-gray-500 border-b border-app-border">
                    <span>Table</span>
                    <span>Rows</span>
                  </div>
                  {Object.entries(dbStats.counts).map(([table, count]: [string, any]) => (
                    <div
                      key={table}
                      className="px-4 py-2.5 grid grid-cols-2 text-xs border-b border-app-border last:border-0"
                    >
                      <span className="font-mono text-gray-600">{table}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={async () => {
                    await invoke('admin:vacuum')
                    toast.success('VACUUM complete')
                    loadDbStats()
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  Run VACUUM
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const bg = color === 'green' ? 'bg-green-50' : color === 'yellow' ? 'bg-yellow-50' : 'bg-red-50'
  const text = color === 'green' ? 'text-green-700' : color === 'yellow' ? 'text-yellow-700' : 'text-red-700'
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <p className={`text-xl font-bold ${text}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
