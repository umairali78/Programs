'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Sparkles } from 'lucide-react'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { useState } from 'react'
import { useAppStore } from '@/store/app.store'

const GRADE_LEVELS = ['TK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SUBJECTS = ['Life Science', 'Earth Science', 'Agriculture', 'Water', 'Biodiversity', 'Climate Justice', 'Indigenous Ecological Knowledge']
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter']

const schema = z.object({
  partnerId: z.string().min(1, 'Partner required'),
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  gradeLevels: z.array(z.string()),
  subjects: z.array(z.string()),
  season: z.array(z.string()),
  maxStudents: z.number().optional(),
  durationMins: z.number().optional(),
  cost: z.number().optional()
})
type FormValues = z.infer<typeof schema>

interface Standard { code: string; desc?: string; framework: string }
interface Props { program: any | null; partners: { id: string; name: string }[]; onClose: () => void; onSaved: () => void }

export function ProgramForm({ program, partners, onClose, onSaved }: Props) {
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)
  const [standards, setStandards] = useState<Standard[]>(program?.standards?.map((s: any) => ({ code: s.standardCode, desc: s.standardDesc, framework: s.framework })) ?? [])
  const [suggestingStandards, setSuggestingStandards] = useState(false)
  const [suggestedStandards, setSuggestedStandards] = useState<Standard[]>([])

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      partnerId: program?.partnerId ?? (partners[0]?.id ?? ''),
      title: program?.title ?? '', description: program?.description ?? '',
      gradeLevels: program ? JSON.parse(program.gradeLevels ?? '[]') : [],
      subjects: program ? JSON.parse(program.subjects ?? '[]') : [],
      season: program ? JSON.parse(program.season ?? '[]') : [],
      maxStudents: program?.maxStudents ?? undefined,
      durationMins: program?.durationMins ?? undefined,
      cost: program?.cost ?? undefined
    }
  })

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = { ...data, cost: data.cost ?? 0, standards }
      if (program) { await invoke('program:update', { id: program.id, updates: payload }); toast.success('Program updated') }
      else { await invoke('program:create', payload); toast.success('Program created') }
      onSaved()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleSuggestStandards = async () => {
    if (!program?.id) return
    setSuggestingStandards(true)
    try {
      const result = await invoke<Standard[]>('ai:suggestStandards', { programId: program.id })
      if (result) setSuggestedStandards(result)
    } catch { toast.error('Failed to suggest standards') }
    finally { setSuggestingStandards(false) }
  }

  const addSuggestedStandard = (s: Standard) => {
    if (!standards.find((x) => x.code === s.code)) setStandards((prev) => [...prev, s])
    setSuggestedStandards((prev) => prev.filter((x) => x.code !== s.code))
  }

  const ToggleChip = ({ value, field, color = 'brand' }: { value: string; field: any; color?: string }) => (
    <button type="button" onClick={() => { const next = field.value.includes(value) ? field.value.filter((x: string) => x !== value) : [...field.value, value]; field.onChange(next) }}
      className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${field.value.includes(value) ? `bg-${color} text-white border-${color}` : 'bg-white text-gray-600 border-gray-200 hover:border-brand'}`}>
      {value}
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <h2 className="text-sm font-semibold text-gray-900">{program ? 'Edit Program' : 'Add Program'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1">
          <form id="program-form" onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
            <Field label="Partner *" error={errors.partnerId?.message}><select {...register('partnerId')} className={inputClass}>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Program Title *" error={errors.title?.message}><input {...register('title')} className={inputClass} placeholder="Watershed Explorers" /></Field>
            <Field label="Description"><textarea {...register('description')} rows={3} className={inputClass} placeholder="What will students experience and learn?" /></Field>

            <Field label="Grade Levels">
              <Controller control={control} name="gradeLevels" render={({ field }) => <div className="flex flex-wrap gap-1">{GRADE_LEVELS.map((g) => <ToggleChip key={g} value={g} field={field} />)}</div>} />
            </Field>
            <Field label="Subjects">
              <Controller control={control} name="subjects" render={({ field }) => <div className="flex flex-wrap gap-1">{SUBJECTS.map((s) => <ToggleChip key={s} value={s} field={field} />)}</div>} />
            </Field>
            <Field label="Season">
              <Controller control={control} name="season" render={({ field }) => <div className="flex flex-wrap gap-1">{SEASONS.map((s) => <ToggleChip key={s} value={s} field={field} color="sky" />)}</div>} />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Cost ($)"><input {...register('cost', { valueAsNumber: true })} type="number" min="0" step="0.50" className={inputClass} placeholder="0" /></Field>
              <Field label="Max Students"><input {...register('maxStudents', { valueAsNumber: true })} type="number" min="1" className={inputClass} placeholder="30" /></Field>
              <Field label="Duration (min)"><input {...register('durationMins', { valueAsNumber: true })} type="number" min="30" className={inputClass} placeholder="120" /></Field>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-700">CA Standards</label>
                {hasClaudeKey && program && (
                  <button type="button" onClick={handleSuggestStandards} disabled={suggestingStandards} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800">
                    {suggestingStandards ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}Suggest Standards
                  </button>
                )}
              </div>
              {standards.length > 0 && (
                <div className="space-y-1 mb-2">
                  {standards.map((s) => (
                    <div key={s.code} className="flex items-center gap-2 text-xs">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">{s.code}</span>
                      <span className="text-gray-500 flex-1">{s.desc}</span>
                      <span className="text-gray-400">{s.framework}</span>
                      <button type="button" onClick={() => setStandards((p) => p.filter((x) => x.code !== s.code))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              {suggestedStandards.length > 0 && (
                <div className="border border-purple-200 rounded-lg p-2 space-y-1 bg-purple-50">
                  <p className="text-xs text-purple-700 font-medium mb-1.5">AI Suggestions — click to add:</p>
                  {suggestedStandards.map((s) => (
                    <button key={s.code} type="button" onClick={() => addSuggestedStandard(s)} className="flex items-center gap-2 w-full text-left text-xs hover:bg-purple-100 rounded px-1 py-0.5 transition-colors">
                      <span className="px-1.5 py-0.5 bg-purple-200 text-purple-700 rounded font-mono">{s.code}</span>
                      <span className="text-gray-600 flex-1">{s.desc}</span>
                      <span className="text-purple-500 text-[10px]">+ Add</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-app-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button type="submit" form="program-form" disabled={isSubmitting} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors">
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{program ? 'Save Changes' : 'Create Program'}
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
