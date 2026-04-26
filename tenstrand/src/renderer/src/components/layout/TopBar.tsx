import { PanelLeftClose, PanelLeftOpen, MessageSquare } from 'lucide-react'
import { useUiStore } from '@/store/ui.store'
import { useAppStore } from '@/store/app.store'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title: string
  children?: React.ReactNode
}

export function TopBar({ title, children }: TopBarProps) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleCopilot = useUiStore((s) => s.toggleCopilot)
  const activeTeacher = useAppStore((s) => s.activeTeacher)
  const hasClaudeKey = useAppStore((s) => s.hasClaudeKey)

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-app-border shrink-0">
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <PanelLeftOpen className="w-4 h-4" />
        ) : (
          <PanelLeftClose className="w-4 h-4" />
        )}
      </button>

      <h1 className="text-sm font-semibold text-gray-900 flex-1">{title}</h1>

      {children}

      <div className="flex items-center gap-2">
        {activeTeacher && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-light rounded-full text-xs text-brand font-medium">
            <div className="w-2 h-2 rounded-full bg-brand" />
            {activeTeacher.name.split(' ')[0]}
          </div>
        )}

        {hasClaudeKey && (
          <button
            onClick={toggleCopilot}
            className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 rounded-full text-xs text-purple-700 font-medium hover:bg-purple-200 transition-colors"
            title="Open AI Copilot"
          >
            <MessageSquare className="w-3 h-3" />
            Copilot
          </button>
        )}
      </div>
    </div>
  )
}
