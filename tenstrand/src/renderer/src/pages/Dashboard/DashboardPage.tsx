import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Map, Trees, BookOpen, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { invoke } from '@/lib/api'
import { useAppStore } from '@/store/app.store'
import { parseJsonArray, formatCost, formatDistance, scoreToPercent } from '@/lib/utils'

interface MatchResult {
  programId: string
  partnerName: string
  title: string
  description: string | null
  cost: number | null
  score: number
  distanceMiles: number | null
  gradeLevels: string[]
  subjects: string[]
}

export function DashboardPage() {
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [partnerCount, setPartnerCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    invoke<any[]>('partner:listForMap').then((pins) => setPartnerCount(pins.length))

    if (activeTeacher) {
      invoke<MatchResult[]>('match:listForTeacher', {
        teacherId: activeTeacher.id,
        radiusMiles: 20
      })
        .then((results) => {
          setMatches(results.slice(0, 5))
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [activeTeacher?.id])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {activeTeacher
              ? `Welcome back, ${activeTeacher.name.split(' ')[0]}`
              : 'Welcome to Climate Learning Exchange'}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeTeacher
              ? `Grades: ${parseJsonArray(activeTeacher.gradeLevels).join(', ') || 'Not set'} · Subjects: ${parseJsonArray(activeTeacher.subjects).join(', ') || 'Not set'}`
              : 'Set an active teacher in Settings to see personalized recommendations.'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard icon={Trees} label="Partners in Network" value={partnerCount} color="brand" />
          <StatCard icon={BookOpen} label="Top Match Score" value={matches[0] ? `${scoreToPercent(matches[0].score)}%` : '—'} color="sky" />
          <StatCard icon={Map} label="Programs Nearby" value={matches.length > 0 ? `${matches.length}+` : '—'} color="earth" />
        </div>

        {/* Recommendations */}
        {activeTeacher ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Top Program Recommendations</h3>
              <Link to="/map" className="text-xs text-brand font-medium hover:underline">
                View all on map →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Compass className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No programs found nearby.</p>
                <p className="text-xs mt-1">Add partners with geocoded locations to see matches.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => (
                  <MatchCard key={m.programId} match={m} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-app-border p-8 text-center">
            <Trees className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Get started</h3>
            <p className="text-xs text-gray-400 mb-4">
              Add teachers via CSV import or manually, then set an active teacher to see personalized
              program recommendations.
            </p>
            <div className="flex gap-2 justify-center">
              <Link
                to="/admin"
                className="px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors"
              >
                Import Data
              </Link>
              <Link
                to="/partners"
                className="px-3 py-1.5 bg-white border border-app-border text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Add Partner
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: any
  label: string
  value: string | number
  color: 'brand' | 'sky' | 'earth'
}) {
  const bgMap = { brand: 'bg-brand-light', sky: 'bg-blue-50', earth: 'bg-amber-50' }
  const textMap = { brand: 'text-brand', sky: 'text-blue-600', earth: 'text-amber-700' }

  return (
    <div className="bg-white rounded-xl border border-app-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${bgMap[color]} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${textMap[color]}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function MatchCard({ match }: { match: MatchResult }) {
  return (
    <div className="bg-white rounded-xl border border-app-border p-4 flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="text-xs text-gray-500">{match.partnerName}</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{match.title}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-bold text-brand leading-none">
              {scoreToPercent(match.score)}%
            </div>
            <p className="text-[10px] text-gray-400">match</p>
          </div>
        </div>

        {match.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{match.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {match.distanceMiles != null && (
            <span>{formatDistance(match.distanceMiles)}</span>
          )}
          <span>{formatCost(match.cost)}</span>
          {match.gradeLevels.length > 0 && (
            <span>Gr. {match.gradeLevels.slice(0, 3).join(', ')}</span>
          )}
        </div>
      </div>
    </div>
  )
}
