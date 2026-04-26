import { useState, useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Plus, Trees, Edit2, Trash2, Globe, Mail, MapPin } from 'lucide-react'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { PartnerForm } from '@/components/partners/PartnerForm'
import { getPartnerTypeName, getPartnerTypeColor } from '@/lib/utils'

interface Partner {
  id: string
  name: string
  type: string
  description: string | null
  address: string | null
  lat: number | null
  lng: number | null
  county: string | null
  contactEmail: string | null
  website: string | null
  status: string
  profileScore: number | null
  geocodingStatus: string | null
}

export function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPartner, setEditPartner] = useState<Partner | null>(null)

  const load = () => {
    setLoading(true)
    invoke<Partner[]>('partner:list')
      .then(setPartners)
      .catch(() => toast.error('Failed to load partners'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete partner "${name}"?`)) return
    try {
      await invoke('partner:delete', { id })
      toast.success('Partner deleted')
      load()
    } catch {
      toast.error('Failed to delete partner')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Partners">
        <button
          onClick={() => { setEditPartner(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Partner
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Trees className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No partners yet</p>
            <p className="text-xs mt-1">Add community partners or import via CSV.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-app-border p-4 flex items-start gap-4"
              >
                {/* Type indicator */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: getPartnerTypeColor(p.type) + '20' }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getPartnerTypeColor(p.type) }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{getPartnerTypeName(p.type)}</span>
                        {p.county && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-500">{p.county} County</span>
                          </>
                        )}
                        <span className="text-gray-300">·</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            p.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditPartner(p); setShowForm(true) }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{p.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {p.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {p.geocodingStatus === 'success' ? '✓ Geocoded' : p.geocodingStatus}
                      </span>
                    )}
                    {p.contactEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {p.contactEmail}
                      </span>
                    )}
                    {p.website && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {p.website.replace(/https?:\/\//, '')}
                      </span>
                    )}
                  </div>

                  {/* Profile score bar */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-1 bg-brand rounded-full transition-all"
                        style={{ width: `${p.profileScore ?? 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{p.profileScore ?? 0}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <PartnerForm
          partner={editPartner}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}
