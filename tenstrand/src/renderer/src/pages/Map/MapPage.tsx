import { TopBar } from '@/components/layout/TopBar'
import { MapView } from '@/components/map/MapView'
import { MapFiltersPanel } from '@/components/map/MapFilters'
import { ProgramCard } from '@/components/map/ProgramCard'
import { PinLegend } from '@/components/map/PinLegend'

export function MapPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Explore Programs" />
      <div className="flex flex-1 overflow-hidden relative">
        <MapFiltersPanel />
        <div className="flex-1 relative overflow-hidden">
          <MapView />
          <PinLegend />
        </div>
        <ProgramCard />
      </div>
    </div>
  )
}
