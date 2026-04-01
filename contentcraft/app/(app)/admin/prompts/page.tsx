import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import PromptEditor from './PromptEditor'
import type { ContentObjectType } from '@/lib/domain/types'

const CO_TYPES: ContentObjectType[] = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6', 'CO7']
const CO_LABELS: Record<string, string> = {
  CO1: 'Model Chapter', CO2: 'Reading Material', CO3: 'Video Script',
  CO4: 'Assessment', CO5: 'Learning Game', CO6: 'Dictionary / Glossary', CO7: 'Teacher Guide',
}

export default async function PromptsAdminPage() {
  await requireRole('ADMIN')

  const prompts = await prisma.promptLibrary.findMany({
    where: { isActive: true },
    include: { updatedBy: { select: { name: true } } },
  })
  const promptMap = Object.fromEntries(prompts.map((p) => [p.contentObjectType, p]))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prompt Library</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit master prompts for each content object type. Changes are auto-versioned.
        </p>
      </div>

      <div className="space-y-4">
        {CO_TYPES.map((coType) => {
          const prompt = promptMap[coType]
          return (
            <div key={coType} className="card">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{CO_LABELS[coType]}</h3>
                  {prompt ? (
                    <p className="text-xs text-gray-400">
                      v{prompt.version} · Last updated by {prompt.updatedBy.name ?? 'Unknown'}
                      {' · '}{new Date(prompt.updatedAt).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-xs text-orange-500">No prompt library set up yet</p>
                  )}
                </div>
              </div>
              <PromptEditor coType={coType} existing={prompt ?? null} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
