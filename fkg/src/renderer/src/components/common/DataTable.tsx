import { cn } from '../../lib/utils'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  loading?: boolean
  keyExtractor?: (row: T) => string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No records found',
  loading,
  keyExtractor
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-card border border-app-border">
        <div className="flex items-center justify-center h-48 text-dark/40">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card border border-app-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-app-border bg-surface">
              {columns.map((col) => (
                <th key={col.key} className={cn('text-left px-4 py-3 font-medium text-dark/60', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-dark/40">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={keyExtractor ? keyExtractor(row) : i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-app-border last:border-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-surface'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-dark', col.className)}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
