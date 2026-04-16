import { cn } from '../../lib/utils'

const STATUS_STYLES: Record<string, string> = {
  // Work order statuses
  New: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Quality Check': 'bg-purple-100 text-purple-700',
  'Ready for Delivery': 'bg-emerald-100 text-emerald-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  'On Hold': 'bg-gray-100 text-gray-600',
  // Stage statuses
  Pending: 'bg-gray-100 text-gray-600',
  Completed: 'bg-green-100 text-green-700',
  'Failed QC': 'bg-red-100 text-red-700',
  Blocked: 'bg-orange-100 text-orange-700',
  // Payment
  ADVANCE: 'bg-blue-100 text-blue-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  FINAL: 'bg-green-100 text-green-700',
  REFUND: 'bg-red-100 text-red-700',
  // Loyalty
  bronze: 'bg-orange-100 text-orange-700',
  silver: 'bg-gray-100 text-gray-600',
  gold: 'bg-yellow-100 text-yellow-700',
  vip: 'bg-purple-100 text-purple-700',
  // Priority
  Urgent: 'bg-red-100 text-red-700',
  Normal: 'bg-blue-100 text-blue-700',
  Flexible: 'bg-gray-100 text-gray-600',
  // Vendor payment
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
  Disputed: 'bg-orange-100 text-orange-700'
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', style, className)}>
      {status}
    </span>
  )
}
