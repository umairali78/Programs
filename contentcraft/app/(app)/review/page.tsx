import { prisma } from '@/lib/db/client'
import { getSession, requireRole } from '@/lib/auth'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

const CO_LABELS: Record<string, string> = {
  CO1: 'Model Chapter', CO2: 'Reading Material', CO3: 'Video Script',
  CO4: 'Assessment', CO5: 'Learning Game', CO6: 'Glossary', CO7: 'Teacher Guide',
}

export default async function ReviewQueuePage() {
  const session = await requireRole('REVIEWER', 'ADMIN')

  const scripts = await prisma.generatedScript.findMany({
    where: {
      reviewStatus: { in: ['IN_REVIEW', 'REVISION_REQUESTED'] },
      OR: [
        { assignedReviewerId: session.user.id },
        { assignedReviewerId: null },
      ],
    },
    include: {
      run: {
        include: { researchBrief: { select: { sloText: true, grade: true, subject: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const statusBadge: Record<string, string> = {
    IN_REVIEW: 'badge-review',
    REVISION_REQUESTED: 'badge-revision',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
        <p className="text-sm text-gray-500 mt-1">{scripts.length} scripts awaiting review.</p>
      </div>

      {scripts.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">No scripts pending review.</div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {scripts.map((s) => (
            <Link
              key={s.id}
              href={`/review/${s.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {CO_LABELS[s.contentObjectType]} · v{s.version}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {s.run.researchBrief?.sloText ?? 'Unknown SLO'} · Grade {s.run.researchBrief?.grade} · {s.run.researchBrief?.subject}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={statusBadge[s.reviewStatus]}>{s.reviewStatus.replace('_', ' ')}</span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(s.createdAt, { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
