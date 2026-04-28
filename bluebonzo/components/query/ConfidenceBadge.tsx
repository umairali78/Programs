import { cn } from '@/lib/utils'
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react'

interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low'
  reason?: string
}

export function ConfidenceBadge({ level, reason }: ConfidenceBadgeProps) {
  const config = {
    high: { label: 'High Confidence', icon: ShieldCheck, className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' },
    medium: { label: 'Medium Confidence', icon: Shield, className: 'text-amber-400 bg-amber-400/10 border-amber-400/25' },
    low: { label: 'Low Confidence', icon: ShieldAlert, className: 'text-destructive bg-destructive/10 border-destructive/25' },
  }
  const { label, icon: Icon, className } = config[level]

  return (
    <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium w-fit', className)} title={reason}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  )
}
