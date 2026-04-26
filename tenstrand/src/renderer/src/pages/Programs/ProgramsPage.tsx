import { useState, useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Plus, BookOpen, Edit2, Trash2 } from 'lucide-react'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { parseJsonArray, formatCost } from '@/lib/utils'
import { ProgramForm } from '@/components/programs/ProgramForm'

interface Program {
  id: string
  partnerId: string
  title: string
  description: string | null
  gradeLevels: string | null
  subjects: string | null
  cost: number | null
  season: string | null
  maxStudents: number | null
  durationMins: number | null
}

interface Partner {
  id: string
  name: string
}

export function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProgram, setEditProgram] = useState<Program | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      invoke<Program[]>('program:list'),
      invoke<Partner[]>('partner:list')
    ])
      .then(([progs, parts]) => {
        setPrograms(progs)
        setPartners(parts)
      })
      .catch(() => toast.error('Failed to load programs'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete program "${title}"?`)) return
    try {
      await invoke('program:delete', { id })
      toast.success('Program deleted')
      load()
    } catch {
      toast.error('Failed to delete program')
    }
  }

  const getPartnerName = (partnerId: string) =>
    partners.find((p) => p.id === partnerId)?.name ?? 'Unknown Partner'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Programs">
        <button
          onClick={() => { setEditProgram(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Program
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No programs yet</p>
            <p className="text-xs mt-1">Add programs under your partners.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-app-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{getPartnerName(p.partnerId)}</p>
                    <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                    {p.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                      <span>{formatCost(p.cost)}</span>
                      {p.maxStudents && <span>Max {p.maxStudents} students</span>}
                      {parseJsonArray(p.gradeLevels).length > 0 && (
                        <span>Gr. {parseJsonArray(p.gradeLevels).join(', ')}</span>
                      )}
                      {parseJsonArray(p.season).length > 0 && (
                        <span>{parseJsonArray(p.season).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditProgram(p); setShowForm(true) }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProgramForm
          program={editProgram}
          partners={partners}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}
