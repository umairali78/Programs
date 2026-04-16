import { type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: { value: number; label: string }
  className?: string
}

export function KPICard({ title, value, subtitle, icon: Icon, iconColor = 'text-brand', trend, className }: KPICardProps) {
  return (
    <div className={cn('bg-white rounded-card border border-app-border p-5 flex gap-4', className)}>
      <div className={cn('w-11 h-11 rounded-lg bg-brand/10 flex items-center justify-center shrink-0', iconColor.replace('text-', 'bg-').replace('-500', '-100').replace('-700', '-100'))}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-dark/50 font-medium truncate">{title}</div>
        <div className="text-2xl font-bold text-dark mt-0.5">{value}</div>
        {subtitle && <div className="text-xs text-dark/40 mt-0.5">{subtitle}</div>}
        {trend && (
          <div className={cn('text-xs mt-1 font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
    </div>
  )
}
