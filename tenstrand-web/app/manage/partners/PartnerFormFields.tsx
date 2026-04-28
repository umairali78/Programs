'use client'

const PARTNER_TYPES = ['Wetlands', 'Agriculture', 'Urban Ecology', 'Climate Justice', 'Indigenous Knowledge', 'General']
const CA_COUNTIES = [
  'Alameda', 'Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa', 'Del Norte',
  'El Dorado', 'Fresno', 'Glenn', 'Humboldt', 'Imperial', 'Inyo', 'Kern', 'Kings', 'Lake',
  'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa', 'Mendocino', 'Merced', 'Modoc', 'Mono',
  'Monterey', 'Napa', 'Nevada', 'Orange', 'Placer', 'Plumas', 'Riverside', 'Sacramento',
  'San Benito', 'San Bernardino', 'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo',
  'San Mateo', 'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Shasta', 'Sierra', 'Siskiyou',
  'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare', 'Tuolumne',
  'Ventura', 'Yolo', 'Yuba', 'Statewide',
]

interface Props {
  defaults?: {
    name?: string
    type?: string
    description?: string
    county?: string | null
    address?: string | null
    contactEmail?: string | null
    website?: string | null
    status?: string
  }
}

const inputClass = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand bg-white'

export function PartnerFormFields({ defaults = {} }: Props) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Organization Name *</label>
        <input name="name" required defaultValue={defaults.name ?? ''} className={inputClass} placeholder="Bay Area Nature Center" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
          <select name="type" required defaultValue={defaults.type ?? ''} className={inputClass}>
            <option value="" disabled>Select type…</option>
            {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select name="status" defaultValue={defaults.status ?? 'active'} className={inputClass}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea name="description" rows={4} defaultValue={defaults.description ?? ''} className={inputClass} placeholder="What environmental programs do you offer?" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">County</label>
        <select name="county" defaultValue={defaults.county ?? ''} className={inputClass}>
          <option value="">Select county…</option>
          {CA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
        <input name="address" defaultValue={defaults.address ?? ''} className={inputClass} placeholder="123 Nature Way, Oakland, CA 94601" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
          <input name="contactEmail" type="email" defaultValue={defaults.contactEmail ?? ''} className={inputClass} placeholder="info@partner.org" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
          <input name="website" type="url" defaultValue={defaults.website ?? ''} className={inputClass} placeholder="https://partner.org" />
        </div>
      </div>
    </>
  )
}
