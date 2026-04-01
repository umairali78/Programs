import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import StandardsUploadForm from './StandardsUploadForm'
import StandardsActivateButton from './StandardsActivateButton'

export default async function StandardsAdminPage() {
  await requireRole('ADMIN')

  const guides = await prisma.standardsGuide.findMany({
    include: {
      uploadedBy: { select: { name: true, email: true } },
      _count: { select: { chunks: true } },
    },
    orderBy: { version: 'desc' },
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Standards Guide</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload new versions of the General Content Development Standards Guide.
          Each version is chunked and embedded for vector retrieval.
        </p>
      </div>

      <StandardsUploadForm />

      <div className="mt-8 card">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Version History</h2>
        </div>
        {guides.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No standards guide uploaded yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {guides.map((g) => (
              <div key={g.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">v{g.version} — {g.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {g.uploadedBy?.name ?? g.uploadedBy?.email} · {new Date(g.uploadedAt).toLocaleDateString()} · {g._count.chunks} chunks
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {g.isActive ? (
                    <span className="badge-approved">Active</span>
                  ) : (
                    <StandardsActivateButton guideId={g.id} chunkCount={g._count.chunks} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
