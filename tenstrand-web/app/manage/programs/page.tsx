import Link from 'next/link'
import { ProgramService } from '@/lib/services/program.service'
import { PartnerService } from '@/lib/services/partner.service'
import { Plus, Pencil } from 'lucide-react'
import { deleteProgram } from './actions'
import { DeleteButton } from '../DeleteButton'

function safeParseArray(val: string | null | undefined): string[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : [String(parsed)]
  } catch {
    return val.split(',').map((s) => s.trim()).filter(Boolean)
  }
}

export default async function ManageProgramsPage() {
  const programSvc = new ProgramService()
  const partnerSvc = new PartnerService()

  const [programs, partners] = await Promise.all([
    programSvc.list(),
    partnerSvc.list(),
  ])

  const partnerMap = new Map(partners.map((p) => [p.id, p.name]))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Programs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{programs.length} programs in database</p>
        </div>
        <Link
          href="/manage/programs/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Program
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-app-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-app-border bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Partner</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Grades</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Subjects</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cost</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {programs.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                  <p className="truncate">{p.title}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {partnerMap.get(p.partnerId ?? '') ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {safeParseArray(p.gradeLevels).slice(0, 3).join(', ') || '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px]">
                  <p className="truncate">{safeParseArray(p.subjects).slice(0, 2).join(', ') || '—'}</p>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {p.cost != null ? (p.cost === 0 ? 'Free' : `$${p.cost}`) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/manage/programs/${p.id}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand-light transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <DeleteButton action={deleteProgram} id={p.id} confirmMessage="Delete this program?" />
                  </div>
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                  No programs yet. <Link href="/manage/programs/new" className="text-brand hover:underline">Add the first one.</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
