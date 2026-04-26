import { TopBar } from '@/components/layout/TopBar'
import { BarChart2 } from 'lucide-react'

export function DistrictPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="District Dashboard" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">District Dashboard</p>
          <p className="text-xs mt-1">Coming in Phase 4 — Analytics</p>
        </div>
      </div>
    </div>
  )
}
