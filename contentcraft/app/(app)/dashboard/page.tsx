import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import Link from 'next/link'
import { FileText, Plus, Clock, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const recentRuns = await prisma.generationRun.findMany({
    where: isAdmin ? {} : { createdById: session!.user.id },
    include: {
      researchBrief: { select: { sloText: true, grade: true, subject: true } },
      _count: { select: { generatedScripts: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const pendingReviews = await prisma.generatedScript.count({
    where: { reviewStatus: 'IN_REVIEW' },
  })

  const totalRuns = await prisma.generationRun.count()
  const approvedScripts = await prisma.generatedScript.count({ where: { reviewStatus: 'APPROVED' } })

  const statusColor: Record<string, string> = {
    COMPLETE: 'badge-approved',
    GENERATING: 'badge-review',
    PENDING: 'badge-draft',
    FAILED: 'badge-revision',
    RESEARCHING: 'badge-review',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {session?.user?.name ?? session?.user?.email}</p>
        </div>
        <Link href="/generate/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Generation
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Runs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalRuns}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Pending Reviews</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingReviews}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Approved Scripts</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{approvedScripts}</p>
        </div>
      </div>

      {/* Recent Runs */}
      <div className="card">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Generation Runs</h2>
        </div>
        {recentRuns.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No generation runs yet. Start your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentRuns.map((run) => (
              <Link
                key={run.id}
                href={`/generate/${run.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {run.researchBrief?.sloText ?? 'Unknown SLO'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Grade {run.researchBrief?.grade} · {run.researchBrief?.subject} ·{' '}
                    {run._count.generatedScripts} scripts
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={statusColor[run.status] ?? 'badge-draft'}>{run.status}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(run.createdAt, { addSuffix: true })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
