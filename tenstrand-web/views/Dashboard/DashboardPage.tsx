'use client'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  BookOpen, Bookmark, CheckCircle2, ChevronRight, Compass, DollarSign,
  GraduationCap, HandHeart, Info, Loader2, Map, MapPin, Quote, School, Send,
  Sparkles, Star, Trees, Users, X, XCircle,
} from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { invoke } from '@/lib/api'
import { useAppStore } from '@/store/app.store'
import { formatCost, formatDistance, parseJsonArray, scoreToPercent } from '@/lib/utils'
import { toast } from 'sonner'

interface Overview { partners: number; programs: number; teachers: number; schools: number; districts: number; activePartners: number; freePrograms: number; geocodedPartners: number }
interface ChartDatum { subject?: string; grade?: string; type?: string; label?: string; count: number }
interface ScoreBreakdown { geo: number; grade: number; subject: number; standards: number; season: number; engagement: number }
interface MatchResult { programId: string; partnerName: string; title: string; description: string | null; cost: number | null; score: number; distanceMiles: number | null; gradeLevels: string[]; subjects: string[]; season: string[]; scoreBreakdown?: ScoreBreakdown }
interface TopProgram { id: string; title: string; partner_name: string; bookmark_count: number; engagement_count: number }
interface CountyCoverage { county: string; partners: number; programs: number }
interface TeacherOpportunity { matchedPrograms: number; reachableStudents: number; schoolName: string | null; nearbySchools: number }
interface TeacherOption { id: string; name: string; email: string | null; gradeLevels: string | null; subjects: string | null; lat: number | null; lng: number | null }
interface InterestRow { program_id: string; program_title: string; program_description: string | null; partner_name: string; partner_type: string; grade_levels: string | null; subjects: string | null; cost: number | null; created_at: number; message: string | null }
interface BookmarkRow { id: string; program_id: string; title: string; description: string | null; grade_levels: string | null; subjects: string | null; cost: number | null; partner_name: string }
interface PeerRec { id: string; title: string; description: string | null; grade_levels: string | null; subjects: string | null; cost: number | null; partner_name: string; peer_bookmark_count: number }
interface SpotlightReview { text: string; rating: number; teacher_name: string; grade_levels: string | null; program_title: string; partner_name: string }

const COLORS = ['#1B6B3A', '#2563EB', '#C2410C', '#7C3AED', '#0F766E', '#B91C1C']

// ── Interest modal ────────────────────────────────────────────────────────────
function InterestModal({
  programId, programTitle, partnerName,
  onClose, onSent,
}: {
  programId: string; programTitle: string; partnerName: string
  onClose: () => void; onSent: () => void
}) {
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!activeTeacher) return
    setSending(true)
    try {
      await invoke('interest:express', { teacherId: activeTeacher.id, programId, message: message.trim() || undefined })
      toast.success('Interest expressed! The partner will be notified.')
      onSent()
    } catch {
      toast.error('Failed to send interest. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Express Interest</h2>
            <p className="text-xs text-gray-500 mt-0.5">Let <span className="font-semibold">{partnerName}</span> know you want to bring this program to your students.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-brand-light rounded-xl p-3">
            <p className="text-xs font-semibold text-brand">{programTitle}</p>
            <p className="text-xs text-gray-600 mt-0.5">by {partnerName}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message to partner <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="e.g. I teach 4th grade science and my students would love to participate in a wetlands field visit this spring..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send Interest
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Match card with interest button ──────────────────────────────────────────
function ScorePip({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const pct = Math.round(value * 100)
  const filled = pct >= 60
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${filled ? `bg-${color}-50 border-${color}-200 text-${color}-700` : 'bg-gray-50 border-gray-200 text-gray-400'}`} title={`${label}: ${pct}%`}>
      <Icon className="w-2.5 h-2.5" />{pct}%
    </div>
  )
}

function criteriaLabel(value: number, type: 'geo' | 'grade' | 'subject' | 'season'): { label: string; detail: string; color: string } {
  const pct = Math.round(value * 100)
  if (type === 'geo') {
    if (pct >= 90) return { label: 'Very close', detail: 'Program is within ~5 miles of your school', color: 'text-green-700' }
    if (pct >= 70) return { label: 'Nearby', detail: 'Program is within ~10 miles', color: 'text-green-600' }
    if (pct >= 50) return { label: 'Moderate distance', detail: 'Program is within ~20 miles', color: 'text-amber-600' }
    return { label: 'Further away', detail: 'Program is more than 20 miles from your school', color: 'text-red-600' }
  }
  if (type === 'grade') {
    if (pct >= 95) return { label: 'Perfect match', detail: 'All your grade levels are covered by this program', color: 'text-green-700' }
    if (pct >= 60) return { label: 'Good alignment', detail: 'Most of your grade levels overlap with this program', color: 'text-green-600' }
    if (pct >= 30) return { label: 'Partial overlap', detail: 'Some grade levels match — check program details', color: 'text-amber-600' }
    return { label: 'Limited overlap', detail: 'Few grade levels align — verify suitability', color: 'text-red-600' }
  }
  if (type === 'subject') {
    if (pct >= 95) return { label: 'Perfect match', detail: 'All your subject interests are covered', color: 'text-green-700' }
    if (pct >= 60) return { label: 'Strong alignment', detail: 'Most subjects in your profile match this program', color: 'text-green-600' }
    if (pct >= 30) return { label: 'Partial alignment', detail: 'Some subject overlap — program may still be useful', color: 'text-amber-600' }
    return { label: 'Low alignment', detail: 'Few subjects match — set your subjects in Settings to improve this', color: 'text-red-600' }
  }
  // season
  if (pct >= 70) return { label: 'Good season fit', detail: 'Program runs during seasons you are typically active', color: 'text-green-600' }
  if (pct >= 40) return { label: 'Partial season fit', detail: 'Program partially overlaps with your schedule', color: 'text-amber-600' }
  return { label: 'Season unclear', detail: 'Season info not available or does not overlap', color: 'text-gray-500' }
}

function CriteriaPopover({ match, onClose }: { match: MatchResult; onClose: () => void }) {
  const sb = match.scoreBreakdown
  if (!sb) return null
  const criteria = [
    { key: 'geo' as const, icon: MapPin, label: 'Proximity', value: sb.geo, color: 'text-green-600' },
    { key: 'grade' as const, icon: GraduationCap, label: 'Grade alignment', value: sb.grade, color: 'text-blue-600' },
    { key: 'subject' as const, icon: BookOpen, label: 'Subject alignment', value: sb.subject, color: 'text-purple-600' },
    { key: 'season' as const, icon: Star, label: 'Season fit', value: sb.season, color: 'text-amber-600' },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Why this program?</h3>
            <p className="text-xs text-gray-400 mt-0.5">{match.partnerName} · {match.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          {criteria.map(({ key, icon: Icon, label, value }) => {
            const c = criteriaLabel(value, key)
            const pct = Math.round(value * 100)
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    <Icon className={`w-3.5 h-3.5 ${c.color}`} />{label}
                  </span>
                  <span className={`text-xs font-bold ${c.color}`}>{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                  <div className="h-1.5 rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[11px] text-gray-500">{c.detail}</p>
              </div>
            )
          })}
          <div className="border-t border-gray-100 pt-3 mt-3">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Overall score: <span className="font-semibold text-gray-700">{Math.round(match.score * 100)}%</span>.
              {sb.grade === 0 && ' · Set your grade levels in Settings to improve grade alignment.'}
              {sb.subject === 0 && ' · Add your subject interests in Settings to improve subject matching.'}
              {match.distanceMiles == null && ' · Add your school location in Settings to enable proximity scoring.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match, interested, onExpressInterest, onRemoveInterest }: {
  match: MatchResult
  interested: boolean
  onExpressInterest: (m: MatchResult) => void
  onRemoveInterest: (programId: string) => void
}) {
  const [removing, setRemoving] = useState(false)
  const [showCriteria, setShowCriteria] = useState(false)
  const sb = match.scoreBreakdown

  const handleRemove = async () => {
    setRemoving(true)
    await onRemoveInterest(match.programId)
    setRemoving(false)
  }

  return (
    <div className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 transition-all ${interested ? 'border-brand/40 ring-1 ring-brand/10' : 'border-app-border hover:border-gray-300'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide truncate">{match.partnerName}</p>
          <p className="text-sm font-bold text-gray-900 leading-snug mt-0.5">{match.title}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1">
            <button onClick={() => setShowCriteria(true)} title="Why was this recommended?" className="p-1 rounded-full hover:bg-amber-50 text-gray-300 hover:text-amber-500 transition-colors">
              <Info className="w-3.5 h-3.5" />
            </button>
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="text-xl font-bold text-gray-900 leading-none">{scoreToPercent(match.score)}%</span>
          </div>
          <p className="text-[10px] text-gray-400">match score</p>
        </div>
      </div>
      {showCriteria && <CriteriaPopover match={match} onClose={() => setShowCriteria(false)} />}

      {match.description && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{match.description}</p>}

      {/* Match criteria pills */}
      {sb && (
        <div className="flex flex-wrap gap-1" title="Match criteria breakdown">
          <ScorePip label="Proximity" value={sb.geo} icon={MapPin} color="green" />
          <ScorePip label="Grade alignment" value={sb.grade} icon={GraduationCap} color="blue" />
          <ScorePip label="Subject alignment" value={sb.subject} icon={BookOpen} color="purple" />
          {sb.season > 0 && <ScorePip label="Season match" value={sb.season} icon={Star} color="amber" />}
        </div>
      )}

      {/* Grade + subject tags */}
      <div className="flex flex-wrap gap-1">
        {match.gradeLevels.slice(0, 5).map((g) => (
          <span key={g} className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700">Gr. {g}</span>
        ))}
        {match.subjects.slice(0, 3).map((s) => (
          <span key={s} className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-brand-light text-brand">{s}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {match.distanceMiles != null && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{formatDistance(match.distanceMiles)}</span>
          )}
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCost(match.cost)}</span>
        </div>
        {interested ? (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-brand"><CheckCircle2 className="w-3.5 h-3.5" />Interest Sent</span>
            <button onClick={handleRemove} disabled={removing} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors" title="Withdraw interest">
              {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            </button>
          </div>
        ) : (
          <button onClick={() => onExpressInterest(match)} className="flex items-center gap-1 px-2.5 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition-colors">
            <HandHeart className="w-3 h-3" />Express Interest
          </button>
        )}
      </div>
    </div>
  )
}

// ── Interest list item ────────────────────────────────────────────────────────
function InterestItem({ interest, onRemove }: { interest: InterestRow; onRemove: (programId: string) => void }) {
  const [removing, setRemoving] = useState(false)
  const grades = parseJsonArray(interest.grade_levels)
  const subjects = parseJsonArray(interest.subjects)
  const date = new Date(interest.created_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const handleRemove = async () => {
    if (!confirm('Withdraw your interest in this program?')) return
    setRemoving(true)
    await onRemove(interest.program_id)
    setRemoving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-app-border p-3.5 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center shrink-0 mt-0.5">
        <CheckCircle2 className="w-4 h-4 text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 truncate">{interest.partner_name}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{interest.program_title}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {grades.slice(0, 3).map((g) => <span key={g} className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700">Gr. {g}</span>)}
          {subjects.slice(0, 2).map((s) => <span key={s} className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-brand-light text-brand">{s}</span>)}
        </div>
        {interest.message && <p className="text-xs text-gray-500 mt-1.5 italic line-clamp-1">"{interest.message}"</p>}
        <p className="text-[10px] text-gray-400 mt-1">Sent {date} · Awaiting response</p>
      </div>
      <button onClick={handleRemove} disabled={removing} className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors shrink-0" title="Withdraw interest">
        {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const setActiveTeacher = useAppStore((s) => s.setActiveTeacher)

  const [overview, setOverview] = useState<Overview | null>(null)
  const [subjects, setSubjects] = useState<ChartDatum[]>([])
  const [grades, setGrades] = useState<ChartDatum[]>([])
  const [types, setTypes] = useState<ChartDatum[]>([])
  const [topPrograms, setTopPrograms] = useState<TopProgram[]>([])
  const [counties, setCounties] = useState<CountyCoverage[]>([])
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [opportunity, setOpportunity] = useState<TeacherOpportunity | null>(null)
  const [interests, setInterests] = useState<InterestRow[]>([])
  const [interestSet, setInterestSet] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([])
  const [bookmarkSet, setBookmarkSet] = useState<Set<string>>(new Set())
  const [peerRecs, setPeerRecs] = useState<PeerRec[]>([])
  const [spotlight, setSpotlight] = useState<SpotlightReview | null>(null)
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(true)
  const [changingTeacher, setChangingTeacher] = useState(false)
  const [interestModal, setInterestModal] = useState<MatchResult | null>(null)

  // Load teacher list once
  useEffect(() => {
    let cancelled = false
    Promise.all([
      invoke<any>('teacher:getActive').catch(() => null),
      invoke<TeacherOption[]>('teacher:list').catch(() => []),
    ]).then(([teacher, list]) => {
      if (cancelled) return
      setTeachers(list)
      if (teacher) setActiveTeacher(teacher)
    })
    return () => { cancelled = true }
  }, [setActiveTeacher])

  const handleTeacherChange = async (id: string) => {
    setChangingTeacher(true)
    try {
      if (!id) { setActiveTeacher(null); return }
      await invoke('teacher:setActive', { id })
      const teacher = await invoke<any>('teacher:get', { id })
      setOpportunity(null); setMatches([]); setInterests([]); setInterestSet(new Set()); setBookmarks([]); setBookmarkSet(new Set()); setPeerRecs([])
      setActiveTeacher(teacher)
    } finally {
      setChangingTeacher(false)
    }
  }

  // Load all data when teacher changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const teacherId = activeTeacher?.id

    const shared = [
      invoke<Overview>('insights:overview'),
      invoke<ChartDatum[]>('insights:programsBySubject'),
      invoke<ChartDatum[]>('insights:programsByGrade'),
      invoke<ChartDatum[]>('insights:partnerTypes'),
      invoke<TopProgram[]>('insights:topPrograms', { limit: 5 }),
      invoke<CountyCoverage[]>('insights:countyCoverage'),
      invoke<SpotlightReview | null>('review:spotlight').catch(() => null),
    ]

    const teacherSpecific = teacherId ? [
      invoke<MatchResult[]>('match:listForTeacher', { teacherId, radiusMiles: 25 }),
      invoke<TeacherOpportunity>('insights:teacherOpportunity', { teacherId, radiusMiles: 30 }),
      invoke<InterestRow[]>('interest:listForTeacher', { teacherId }),
      invoke<any>('interest:getSet', { teacherId }),
      invoke<BookmarkRow[]>('bookmark:listForTeacher', { teacherId }),
      invoke<string[]>('bookmark:getSet', { teacherId }),
      invoke<PeerRec[]>('bookmark:peerRecommendations', { teacherId, limit: 3 }),
    ] : [
      Promise.resolve([]),
      Promise.resolve(null),
      Promise.resolve([]),
      Promise.resolve({}),
      Promise.resolve([]),
      Promise.resolve([]),
      Promise.resolve([]),
    ]

    Promise.all([...shared, ...teacherSpecific])
      .then(([o, s, g, t, top, c, spot, m, opp, ints, iset, bmarks, bids, precs]) => {
        if (cancelled) return
        setOverview(o as Overview); setSubjects(s as ChartDatum[]); setGrades(g as ChartDatum[]); setTypes(t as ChartDatum[])
        setTopPrograms(top as TopProgram[]); setCounties(c as CountyCoverage[])
        setSpotlight(spot as SpotlightReview | null)
        setMatches((m as MatchResult[]).slice(0, 8))
        setOpportunity(opp as TeacherOpportunity | null)
        setInterests(ints as InterestRow[])
        setInterestSet(new Set(Array.isArray(iset) ? (iset as string[]) : []))
        setBookmarks(bmarks as BookmarkRow[])
        setBookmarkSet(new Set(Array.isArray(bids) ? (bids as string[]) : []))
        setPeerRecs(precs as PeerRec[])
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [activeTeacher?.id, activeTeacher?.gradeLevels, activeTeacher?.subjects, activeTeacher?.lat, activeTeacher?.lng])

  // Reload interests only (after express/remove actions)
  const reloadInterests = async () => {
    if (!activeTeacher) return
    const [ints, iset] = await Promise.all([
      invoke<InterestRow[]>('interest:listForTeacher', { teacherId: activeTeacher.id }),
      invoke<any>('interest:getSet', { teacherId: activeTeacher.id }),
    ])
    setInterests(ints)
    setInterestSet(new Set(Array.isArray(iset) ? (iset as string[]) : []))
  }

  const reloadBookmarks = async () => {
    if (!activeTeacher) return
    const [bmarks, bids] = await Promise.all([
      invoke<BookmarkRow[]>('bookmark:listForTeacher', { teacherId: activeTeacher.id }),
      invoke<string[]>('bookmark:getSet', { teacherId: activeTeacher.id }),
    ])
    setBookmarks(bmarks)
    setBookmarkSet(new Set(Array.isArray(bids) ? (bids as string[]) : []))
  }

  const handleRemoveInterest = async (programId: string) => {
    if (!activeTeacher) return
    await invoke('interest:remove', { teacherId: activeTeacher.id, programId })
    await reloadInterests()
    toast.success('Interest withdrawn.')
  }

  const handleRemoveBookmark = async (programId: string) => {
    if (!activeTeacher) return
    await invoke('bookmark:remove', { teacherId: activeTeacher.id, programId })
    await reloadBookmarks()
    toast.success('Removed from saved programs.')
  }

  const coverage = useMemo(() => {
    if (!overview?.partners) return 0
    return Math.round((overview.geocodedPartners / overview.partners) * 100)
  }, [overview])

  const teacherGrades = parseJsonArray(activeTeacher?.gradeLevels)
  const teacherSubjects = parseJsonArray(activeTeacher?.subjects)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">

        {/* ── Hero banner ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-[#0d4a28] p-6 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-24 w-40 h-40 bg-white rounded-full translate-y-1/2" />
          </div>
          <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {activeTeacher ? (
                <>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Teacher Dashboard</p>
                  <h1 className="text-2xl font-bold mt-1">Welcome, {activeTeacher.name.split(' ')[0]}</h1>
                  <p className="text-white/80 text-sm mt-1">
                    {opportunity?.schoolName ?? 'Your school'} ·{' '}
                    {teacherGrades.length > 0 ? `Grades ${teacherGrades.join(', ')}` : 'Grades not set'} ·{' '}
                    {teacherSubjects.length > 0 ? teacherSubjects.slice(0, 3).join(', ') : 'Subjects not set'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Pill icon={Sparkles} label={`${opportunity?.matchedPrograms ?? matches.length} matched programs`} />
                    <Pill icon={HandHeart} label={`${interests.length} interests expressed`} />
                    <Pill icon={School} label={`${opportunity?.nearbySchools ?? 0} nearby schools`} />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Climate Learning Exchange</p>
                  <h1 className="text-2xl font-bold mt-1">Network Overview</h1>
                  <p className="text-white/80 text-sm mt-1">
                    {overview?.activePartners ?? '…'} active partners · {overview?.programs ?? '…'} programs · {overview?.freePrograms ?? '…'} free
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Pill icon={Trees} label={`${coverage}% partners geocoded`} />
                    <Pill icon={School} label={`${overview?.schools ?? '…'} schools`} />
                    <Pill icon={GraduationCap} label={`${overview?.teachers ?? '…'} teachers`} />
                  </div>
                </>
              )}
            </div>

            {/* Teacher selector */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 min-w-64 border border-white/20">
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Active Teacher Profile</label>
              <div className="flex items-center gap-2">
                <select
                  value={activeTeacher?.id ?? ''}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                  className="w-full text-sm rounded-lg px-3 py-2 bg-white/20 text-white border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/40 [&>option]:text-gray-900 [&>option]:bg-white"
                >
                  <option value="">No active teacher</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {changingTeacher && <Loader2 className="w-4 h-4 text-white/70 animate-spin shrink-0" />}
              </div>
              {!activeTeacher && (
                <p className="text-white/50 text-[10px] mt-1.5">Select a teacher to see personalised opportunities.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Teacher opportunity section ───────────────────────────────────── */}
        {activeTeacher && (
          <>
            {/* Matched programs */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" />Programs Matched For You</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Climate programs within 25 miles that align with your grades and subjects.</p>
                </div>
                <Link to="/map" className="flex items-center gap-1 text-xs text-brand font-medium hover:underline"><Map className="w-3.5 h-3.5" />View on map</Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />)}</div>
              ) : matches.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                  <Compass className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-500">No nearby programs found.</p>
                  <p className="text-xs text-gray-400 mt-1">Make sure your location and subjects are set in Settings.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {matches.map((m) => (
                    <MatchCard
                      key={m.programId}
                      match={m}
                      interested={interestSet.has(m.programId)}
                      onExpressInterest={(match) => setInterestModal(match)}
                      onRemoveInterest={handleRemoveInterest}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Expressed interests */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><HandHeart className="w-4 h-4 text-brand" />Your Expressed Interests</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Programs you've told partners you want to bring to your students.</p>
                </div>
                {interests.length > 0 && <span className="text-xs font-bold text-brand bg-brand-light px-2.5 py-1 rounded-full">{interests.length}</span>}
              </div>
              {loading ? (
                <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}</div>
              ) : interests.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                  <HandHeart className="w-7 h-7 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">No interests yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Click <span className="font-semibold">Express Interest</span> on any matched program above to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {interests.map((interest) => (
                    <InterestItem
                      key={interest.program_id}
                      interest={interest}
                      onRemove={handleRemoveInterest}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Saved programs (bookmarks) */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Bookmark className="w-4 h-4 text-blue-500" />Saved Programs</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Programs you've bookmarked to revisit later.</p>
                </div>
                {bookmarks.length > 0 && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{bookmarks.length}</span>}
              </div>
              {loading ? (
                <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
              ) : bookmarks.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                  <Bookmark className="w-7 h-7 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">No saved programs yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Use the <span className="font-semibold">bookmark icon</span> on any program to save it here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((b) => <BookmarkItem key={b.id} bookmark={b} onRemove={() => handleRemoveBookmark(b.program_id)} />)}
                </div>
              )}
            </section>

            {/* Peer recommendations */}
            {peerRecs.length > 0 && (
              <section>
                <div className="mb-3">
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Users className="w-4 h-4 text-purple-500" />Programs Teachers Like You Saved</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Based on what teachers with similar interests have bookmarked.</p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                  {peerRecs.map((rec) => (
                    <div key={rec.id} className="bg-white rounded-xl border border-app-border p-3.5 flex flex-col gap-2">
                      <div>
                        <p className="text-[11px] text-gray-400">{rec.partner_name}</p>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{rec.title}</p>
                      </div>
                      {rec.description && <p className="text-xs text-gray-500 line-clamp-2">{rec.description}</p>}
                      <div className="flex items-center gap-1 mt-auto">
                        <Bookmark className="w-3 h-3 text-purple-400" />
                        <span className="text-[11px] text-purple-600 font-medium">{rec.peer_bookmark_count} peer{rec.peer_bookmark_count !== 1 ? 's' : ''} saved</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="border-t border-gray-200" />
          </>
        )}

        {/* ── No teacher selected CTA ───────────────────────────────────────── */}
        {!activeTeacher && !loading && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
            <GraduationCap className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-600">Select a teacher profile above to see personalised program matches.</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Opportunities are ranked by proximity, grade alignment, and subject fit.</p>
            <RouterLink to="/settings" className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition-colors">
              <GraduationCap className="w-3.5 h-3.5" />Open Settings
            </RouterLink>
          </div>
        )}

        {/* ── Spotlight review ─────────────────────────────────────────────── */}
        {spotlight && (
          <div className="relative overflow-hidden bg-brand-dark rounded-2xl p-5 text-white">
            <div className="absolute top-3 right-4 opacity-10"><Quote className="w-20 h-20" /></div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">Teacher Spotlight</p>
            </div>
            <blockquote className="text-sm italic text-white/90 leading-relaxed mb-4 max-w-prose">"{spotlight.text}"</blockquote>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">{spotlight.teacher_name}</p>
                <p className="text-[11px] text-white/50 mt-0.5">{spotlight.program_title} · {spotlight.partner_name}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {[...Array(spotlight.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
              </div>
            </div>
          </div>
        )}

        {/* ── Network stats ────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-gray-500" />Network Overview</h2>

          {/* Stat row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
            <StatCard icon={Trees} label="Active Partners" value={overview?.activePartners ?? '—'} sub={`${coverage}% geocoded`} color="green" />
            <StatCard icon={BookOpen} label="Programs" value={overview?.programs ?? '—'} sub={`${overview?.freePrograms ?? 0} free`} color="blue" />
            <StatCard icon={GraduationCap} label="Teachers" value={overview?.teachers ?? '—'} sub={`${overview?.districts ?? 0} districts`} color="purple" />
            <StatCard icon={School} label="Schools" value={overview?.schools ?? '—'} sub={`${overview?.districts ?? 0} districts`} color="orange" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
            <ChartPanel title="Programs by Subject" subtitle="Programs tagged to each subject area" className="xl:col-span-2">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subjects.slice(0, 8)} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="subject" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} width={28} />
                  <Tooltip formatter={(v) => [`${v} programs`, 'Programs']} />
                  <Bar dataKey="count" fill="#1B6B3A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
            <ChartPanel title="Partner Types" subtitle="Partners grouped by focus area">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={types} dataKey="count" nameKey="label" outerRadius={70} innerRadius={36} paddingAngle={2}>
                    {types.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, _n, item) => [`${v} partners`, (item.payload as ChartDatum).label ?? 'Type']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-1">
                {types.map((t, i) => (
                  <div key={t.type ?? t.label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600 min-w-0">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate">{t.label ?? t.type}</span>
                    </span>
                    <span className="font-semibold text-gray-800 ml-2">{t.count}</span>
                  </div>
                ))}
              </div>
            </ChartPanel>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <ChartPanel title="Grade Coverage" subtitle="Programs per grade level">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={grades} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="grade" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={28} />
                  <Tooltip formatter={(v) => [`${v} programs`, 'Programs']} />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ListPanel title="Most Engaged Programs" icon={Star} empty="No engagement data yet.">
              {topPrograms.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{p.title}</p>
                    <p className="text-[11px] text-gray-400 truncate">{p.partner_name}</p>
                  </div>
                  <span className="text-xs font-bold text-brand shrink-0">{p.engagement_count + p.bookmark_count}</span>
                </div>
              ))}
            </ListPanel>

            <ListPanel title="County Coverage" icon={Map} empty="No county data yet.">
              {counties.slice(0, 6).map((c) => (
                <div key={c.county} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{c.county} County</p>
                  <p className="text-[11px] text-gray-500 shrink-0">{c.programs}p · {c.partners}r</p>
                </div>
              ))}
            </ListPanel>
          </div>
        </div>
      </div>

      {/* ── Interest modal ──────────────────────────────────────────────────── */}
      {interestModal && (
        <InterestModal
          programId={interestModal.programId}
          programTitle={interestModal.title}
          partnerName={interestModal.partnerName}
          onClose={() => setInterestModal(null)}
          onSent={async () => {
            setInterestModal(null)
            await reloadInterests()
          }}
        />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Pill({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 text-white/90 text-xs font-medium rounded-full backdrop-blur-sm">
      <Icon className="w-3 h-3" />{label}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub: string; color: 'green' | 'blue' | 'purple' | 'orange' }) {
  const bg = { green: 'bg-green-50', blue: 'bg-blue-50', purple: 'bg-purple-50', orange: 'bg-orange-50' }[color]
  const text = { green: 'text-green-600', blue: 'text-blue-600', purple: 'text-purple-600', orange: 'text-orange-600' }[color]
  return (
    <div className="bg-white rounded-xl border border-app-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${text}`} /></div>
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p><p className="text-[11px] text-gray-400">{sub}</p></div>
    </div>
  )
}

function ChartPanel({ title, subtitle, className = '', children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-xl border border-app-border p-4 ${className}`}>
      <p className="text-xs font-bold text-gray-900">{title}</p>
      {subtitle && <p className="text-[11px] text-gray-400 mt-0.5 mb-3">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  )
}

function BookmarkItem({ bookmark, onRemove }: { bookmark: BookmarkRow; onRemove: () => void }) {
  const [removing, setRemoving] = useState(false)
  const grades = parseJsonArray(bookmark.grade_levels)
  const subjects = parseJsonArray(bookmark.subjects)

  const handleRemove = async () => {
    setRemoving(true)
    await onRemove()
    setRemoving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-app-border p-3.5 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
        <Bookmark className="w-4 h-4 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 truncate">{bookmark.partner_name}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{bookmark.title}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {grades.slice(0, 3).map((g) => <span key={g} className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700">Gr. {g}</span>)}
          {subjects.slice(0, 2).map((s) => <span key={s} className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-brand-light text-brand">{s}</span>)}
          {bookmark.cost != null && <span className="text-[10px] text-gray-400">{formatCost(bookmark.cost)}</span>}
        </div>
      </div>
      <button onClick={handleRemove} disabled={removing} className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors shrink-0" title="Remove bookmark">
        {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
      </button>
    </div>
  )
}

function ListPanel({ title, icon: Icon, empty, children }: { title: string; icon: any; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : (children ? [children] : [])
  return (
    <div className="bg-white rounded-xl border border-app-border p-4">
      <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5 mb-3"><Icon className="w-3.5 h-3.5 text-gray-400" />{title}</p>
      {items.length === 0
        ? <p className="text-xs text-gray-400 text-center py-8">{empty}</p>
        : children}
    </div>
  )
}
