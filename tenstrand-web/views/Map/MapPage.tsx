'use client'
import { TopBar } from '@/components/layout/TopBar'
import dynamic from 'next/dynamic'
import { MapFiltersPanel } from '@/components/map/MapFilters'
import { ProgramCard } from '@/components/map/ProgramCard'
import { PinLegend } from '@/components/map/PinLegend'

const MapView = dynamic(() => import('@/components/map/MapView').then((m) => m.MapView), { ssr: false, loading: () => <div className="flex-1 bg-gray-100 animate-pulse" /> })

export function MapPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Explore Programs" />
      <div className="flex flex-1 overflow-hidden relative">
        <MapFiltersPanel />
        <div className="flex-1 relative overflow-hidden flex">
          <MapView />
          <PinLegend />
        </div>
        <ProgramCard />
      </div>
    </div>
  )
}
