import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { invoke } from '@/lib/api'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app.store'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.string().min(1),
  description: z.string().optional(),
  address: z.string().optional(),
  county: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  status: z.string()
})

type FormValues = z.infer<typeof schema>

const PARTNER_TYPES = [
  { value: 'wetlands', label: 'Wetlands' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'urban_ecology', label: 'Urban Ecology' },
  { value: 'climate_justice', label: 'Climate Justice' },
  { value: 'indigenous_knowledge', label: 'Indigenous Knowledge' },
  { value: 'general', label: 'General' }
]

interface Props {
  partner: any | null
  onClose: () => void
  onSaved: () => void
}

export function PartnerForm({ partner, onClose, onSaved }: Props) {
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)
  const [brochureText, setBrochureText] = useState('')
  const [showBrochure, setShowBrochure] = useState(false)
  const [extracting, setExtracting] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: partner?.name ?? '',
      type: partner?.type ?? 'general',
      description: partner?.description ?? '',
      address: partner?.address ?? '',
      county: partner?.county ?? '',
      contactEmail: partner?.contactEmail ?? '',
      website: partner?.website ?? '',
      status: partner?.status ?? 'active'
    }
  })

  const onSubmit = async (data: FormValues) => {
    try {
      if (partner) {
        await invoke('partner:update', { id: partner.id, updates: data })
        toast.success('Partner updated')
      } else {
        await invoke('partner:create', data)
        toast.success('Partner created')
      }
      onSaved()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleExtractBrochure = async () => {
    if (!brochureText.trim()) return
    setExtracting(true)
    try {
      const result = await invoke<any>('ai:extractFromBrochure', { text: brochureText })
      if (result) {
        if (result.title) setValue('name', result.title)
        if (result.description) setValue('description', result.description)
        toast.success('Fields extracted from brochure')
        setShowBrochure(false)
      }
    } catch {
      toast.error('Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <h2 className="text-sm font-semibold text-gray-900">
            {partner ? 'Edit Partner' : 'Add New Partner'}
          </h2>
          <div className="flex items-center gap-2">
            {hasClaudeKey && !partner && (
              <button
                type="button"
                onClick={() => setShowBrochure(!showBrochure)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Import from Brochure
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1">
          {/* Brochure import panel */}
          {showBrochure && (
            <div className="p-4 border-b border-app-border bg-purple-50">
              <p className="text-xs font-semibold text-purple-700 mb-2">
                Paste partner brochure or description text
              </p>
              <textarea
                value={brochureText}
                onChange={(e) => setBrochureText(e.target.value)}
                rows={4}
                className="w-full text-xs border border-purple-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                placeholder="Paste program description, brochure text, or website content..."
              />
              <button
                type="button"
                onClick={handleExtractBrochure}
                disabled={extracting || !brochureText.trim()}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {extracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Extract Fields
              </button>
            </div>
          )}

          {/* Form */}
          <form id="partner-form" onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
            <Field label="Partner Name *" error={errors.name?.message}>
              <input {...register('name')} className={inputClass} placeholder="Elkhorn Slough Foundation" />
            </Field>

            <Field label="Type *">
              <select {...register('type')} className={inputClass}>
                {PARTNER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Description">
              <textarea
                {...register('description')}
                rows={3}
                className={inputClass}
                placeholder="Brief description of the organization and its educational programs..."
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="County">
                <input {...register('county')} className={inputClass} placeholder="Santa Cruz" />
              </Field>
              <Field label="Status">
                <select {...register('status')} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>

            <Field label="Address (for geocoding)">
              <input {...register('address')} className={inputClass} placeholder="1700 Elkhorn Rd, Watsonville, CA" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Email" error={errors.contactEmail?.message}>
                <input {...register('contactEmail')} type="email" className={inputClass} placeholder="info@example.org" />
              </Field>
              <Field label="Website">
                <input {...register('website')} className={inputClass} placeholder="https://example.org" />
              </Field>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-app-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="partner-form"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {partner ? 'Save Changes' : 'Create Partner'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputClass =
  'w-full text-xs border border-app-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand bg-white'
