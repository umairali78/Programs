'use client'
import { Trash2 } from 'lucide-react'

interface Props {
  action: (formData: FormData) => Promise<void>
  id: string
  confirmMessage: string
}

export function DeleteButton({ action, id, confirmMessage }: Props) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        onClick={(e) => { if (!confirm(confirmMessage)) e.preventDefault() }}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </form>
  )
}
