import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import AnalyticsDashboard from './AnalyticsDashboard'
import type { ContentObjectType } from '@prisma/client'

const CO_TYPES: ContentObjectType[] = ['CO1','CO2','CO3','CO4','CO5','CO6','CO7']
const DIMS = ['standardsCompliance','gradeAppropriateness','templateAdherence','engagementQuality','pakistanContextAccuracy']

export default async function AnalyticsPage() {
  await requireRole('ADMIN')

  // Aggregate averages per CO type per dimension
  const allFeedback = await prisma.reviewFeedback.findMany({
    include: { script: { select: { contentObjectType: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  const grouped: Record<string, Record<string, number[]>> = {}
  for (const co of CO_TYPES) {
    grouped[co] = Object.fromEntries(DIMS.map((d) => [d, []]))
  }

  for (const f of allFeedback) {
    const co = f.script.contentObjectType
    if (grouped[co]) {
      for (const dim of DIMS) {
        grouped[co][dim].push(f[dim as keyof typeof f] as number)
      }
    }
  }

  const averages: Record<string, Record<string, number>> = {}
  for (const co of CO_TYPES) {
    averages[co] = {}
    for (const dim of DIMS) {
      const vals = grouped[co][dim]
      averages[co][dim] = vals.length > 0
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
        : 0
    }
  }

  // Top flagged compliance criteria
  const flaggedScripts = await prisma.generatedScript.findMany({
    select: { complianceSummary: true },
    take: 200,
  })
  const criterionCounts: Record<string, number> = {}
  for (const s of flaggedScripts) {
    const summary = s.complianceSummary as { criterion: string; status: string }[]
    for (const c of summary) {
      if (c.status === 'flag') {
        criterionCounts[c.criterion] = (criterionCounts[c.criterion] ?? 0) + 1
      }
    }
  }
  const topFlagged = Object.entries(criterionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([criterion, count]) => ({ criterion, count }))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Feedback Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Average scores per content object type and dimension.</p>
      </div>
      <AnalyticsDashboard averages={averages} topFlagged={topFlagged} totalFeedback={allFeedback.length} />
    </div>
  )
}
