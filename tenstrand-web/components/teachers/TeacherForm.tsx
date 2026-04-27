'use client'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, X } from 'lucide-react'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'

const GRADE_LEVELS = ['TK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SUBJECTS = ['Life Science', 'Earth Science', 'Agriculture', 'Water', 'Biodiversity', 'Climate Justice', 'Indigenous Ecological Knowledge']

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email().optional().or(z.literal('')),
  schoolId: z.string().optional(),
  gradeLevels: z.array(z.string()),
  subjects: z.array(z.string()),
  zip: z.string().optional(),
})

type FormValues = z.infer<typeof schema>
interface SchoolOption { id: string; name: string; city: string | null; county: string | null; lat: number | null; lng: number | null }
interface Props { schools: SchoolOption[]; onClose: () => void; onSaved: () => void }

export function TeacherForm({ schools, onClose, onSaved }: Props) {
  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', schoolId: schools[0]?.id ?? '', gradeLevels: [], subjects: [], zip: '' }
  })

  const schoolId = watch('schoolId')

  const onSubmit = async (data: FormValues) => {
    const school = schools.find((s) => s.id === data.schoolId)
    try {
      await invoke('teacher:create', {
        name: data.name,
        email: data.email || undefined,
        schoolId: data.schoolId || undefined,
        gradeLevels: data.gradeLevels,
        subjects: data.subjects,
        lat: school?.lat ?? undefined,
        lng: school?.lng ?? undefined,
        zip: data.zip || undefined,
      })
      toast.success('Teacher added')
      onSaved()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add teacher')
    }
  }

  const ToggleChip = ({ value, field }: { value: string; field: any }) => (
    <button type="button" onClick={() => {
      const next = field.value.includes(value) ? field.value.filter((x: string) => x !== value) : [...field.value, value]
      field.onChange(next)
    }} className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${field.value.includes(value) ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand'}`}>
      {value}
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <h2 className="text-sm font-semibold text-gray-900">Add Teacher</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <form id="teacher-form" onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 overflow-y-auto scrollbar-thin">
          <Field label="Teacher Name *" error={errors.name?.message}><input {...register('name')} className={inputClass} placeholder="Alex Morgan" /></Field>
          <Field label="Email" error={errors.email?.message}><input {...register('email')} type="email" className={inputClass} placeholder="alex@school.org" /></Field>
          <Field label="School">
            <select {...register('schoolId')} className={inputClass}>
              <option value="">No school assigned</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? `, ${s.city}` : ''}</option>)}
            </select>
            {schoolId && <p className="text-[11px] text-gray-400 mt-1">Teacher location will use the selected school for matching and map radius.</p>}
          </Field>
          <Field label="Zip Code"><input {...register('zip')} className={inputClass} placeholder="95062" /></Field>
          <Field label="Grade Levels">
            <Controller control={control} name="gradeLevels" render={({ field }) => <div className="flex flex-wrap gap-1">{GRADE_LEVELS.map((g) => <ToggleChip key={g} value={g} field={field} />)}</div>} />
          </Field>
          <Field label="Subjects">
            <Controller control={control} name="subjects" render={({ field }) => <div className="flex flex-wrap gap-1">{SUBJECTS.map((s) => <ToggleChip key={s} value={s} field={field} />)}</div>} />
          </Field>
        </form>

        <div className="flex justify-end gap-2 p-4 border-t border-app-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button type="submit" form="teacher-form" disabled={isSubmitting} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors">
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Create Teacher
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>{children}{error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}</div>
}

const inputClass = 'w-full text-xs border border-app-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand bg-white'
