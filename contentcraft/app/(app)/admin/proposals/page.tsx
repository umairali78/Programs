import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import ProposalCard from './ProposalCard'

export default async function ProposalsPage() {
  await requireRole('ADMIN')

  const proposals = await prisma.improvementProposal.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  const pending = proposals.filter((p) => p.status === 'PENDING')
  const resolved = proposals.filter((p) => p.status !== 'PENDING')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Improvement Proposals</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-generated proposals based on reviewer feedback patterns. Accept or reject each suggestion.
        </p>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pending ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((p) => <ProposalCard key={p.id} proposal={p} />)}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Resolved ({resolved.length})
          </h2>
          <div className="space-y-4">
            {resolved.map((p) => <ProposalCard key={p.id} proposal={p} readonly />)}
          </div>
        </section>
      )}

      {proposals.length === 0 && (
        <div className="card p-10 text-center text-gray-400">
          <p>No improvement proposals yet.</p>
          <p className="text-sm mt-1">They will appear here once enough reviewer feedback is collected.</p>
        </div>
      )}
    </div>
  )
}
