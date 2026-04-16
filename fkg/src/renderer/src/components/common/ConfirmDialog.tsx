import { AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  danger = false
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-card shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex gap-3 mb-4">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', danger ? 'bg-red-100' : 'bg-amber-100')}>
            <AlertTriangle size={18} className={danger ? 'text-red-600' : 'text-amber-600'} />
          </div>
          <div>
            <h3 className="font-semibold text-dark">{title}</h3>
            <p className="text-sm text-dark/60 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-app-border rounded-lg hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 text-sm rounded-lg text-white transition-colors',
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand/90'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
