'use client'
import { getPartnerTypeColor, getPartnerTypeName } from '@/lib/utils'

const TYPES = ['wetlands', 'agriculture', 'urban_ecology', 'climate_justice', 'indigenous_knowledge', 'general']

export function PinLegend() {
  return (
    <div className="absolute bottom-4 left-60 z-10 bg-white rounded-lg shadow-md border border-app-border p-2.5 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">Partner Types</p>
      <div className="space-y-1">
        {TYPES.map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: getPartnerTypeColor(type) }} />
            <span className="text-gray-600">{getPartnerTypeName(type)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
