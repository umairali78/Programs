import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProgramService } from '@/lib/services/program.service'
import { PartnerService } from '@/lib/services/partner.service'
import { ArrowLeft } from 'lucide-react'
import { updateProgram } from '../actions'
import { ProgramFormFields } from '../ProgramFormFields'
import { SubmitButton } from '../../SubmitButton'

function safeParseArray(val: string | null | undefined): string[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : [String(parsed)]
  } catch {
    return val.split(',').map((s) => s.trim()).filter(Boolean)
  }
}

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const programSvc = new ProgramService()
  const partnerSvc = new PartnerService()

  const [program, partners] = await Promise.all([
    programSvc.get(id),
    partnerSvc.list(),
  ])

  if (!program) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/manage/programs" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Program</h1>
      </div>

      <form action={updateProgram} className="bg-white rounded-xl border border-app-border p-6 space-y-5">
        <input type="hidden" name="id" value={program.id} />
        <ProgramFormFields
          partners={partners.map((p) => ({ id: p.id, name: p.name }))}
          defaults={{
            partnerId: program.partnerId ?? undefined,
            title: program.title,
            description: program.description ?? undefined,
            gradeLevels: safeParseArray(program.gradeLevels),
            subjects: safeParseArray(program.subjects),
            season: safeParseArray(program.season),
            cost: program.cost,
            maxStudents: program.maxStudents,
            durationMins: program.durationMins,
          }}
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-app-border">
          <Link href="/manage/programs" className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </Link>
          <SubmitButton label="Save Changes" />
        </div>
      </form>
    </div>
  )
}
