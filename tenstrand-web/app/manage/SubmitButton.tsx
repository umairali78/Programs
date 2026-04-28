'use client'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 px-5 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
    >
      {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {label}
    </button>
  )
}
