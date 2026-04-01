import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import TemplateUploadForm from './TemplateUploadForm'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

const CO_LABELS: Record<string, string> = {
  CO1: 'Model Chapter', CO2: 'Reading Material', CO3: 'Video Script',
  CO4: 'Assessment', CO5: 'Learning Game', CO6: 'Dictionary / Glossary', CO7: 'Teacher Guide',
}

export default async function TemplatesAdminPage() {
  await requireRole('ADMIN')

  const templates = await prisma.contentTemplate.findMany({
    include: { uploadedBy: { select: { name: true, email: true } } },
    orderBy: [{ contentObjectType: 'asc' }, { version: 'desc' }],
  })

  // Group by CO type
  const grouped: Record<string, typeof templates> = {}
  for (const t of templates) {
    if (!grouped[t.contentObjectType]) grouped[t.contentObjectType] = []
    grouped[t.contentObjectType].push(t)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
        <p className="text-sm text-gray-500 mt-1">Upload and activate content templates for each object type.</p>
      </div>

      <TemplateUploadForm />

      <div className="mt-8 space-y-6">
        {Object.entries(CO_LABELS).map(([coType, label]) => {
          const items = grouped[coType] ?? []
          const active = items.find((t) => t.isActive)
          return (
            <div key={coType} className="card">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{label}</h3>
                  <p className="text-xs text-gray-400">{coType}</p>
                </div>
                {active ? (
                  <span className="badge-approved">v{active.version} active</span>
                ) : (
                  <span className="badge-draft">No active template</span>
                )}
              </div>

              {items.length === 0 ? (
                <div className="p-4 text-sm text-gray-400 italic">No templates uploaded yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {items.map((t) => (
                    <div key={t.id} className="flex items-center gap-4 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">v{t.version} — {t.fileName}</p>
                        <p className="text-xs text-gray-400">
                          {t.uploadedBy?.name ?? t.uploadedBy?.email} · {new Date(t.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.parseStatus === 'parsed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : t.parseStatus === 'parsing' ? (
                          <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
                        ) : t.parseStatus === 'failed' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-400">{t.parseStatus}</span>
                        {!t.isActive && t.parseStatus === 'parsed' && (
                          <form action={`/api/templates/${t.id}/activate`} method="POST">
                            <button className="btn-secondary text-xs py-1 px-2">Activate</button>
                          </form>
                        )}
                        {t.isActive && (
                          <span className="badge-approved">Active</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
