'use client'
import { TopBar } from '@/components/layout/TopBar'
import { CopilotPanel } from '@/components/copilot/CopilotPanel'
import { useUiStore } from '@/store/ui.store'
import { useEffect } from 'react'

export function CopilotPage() {
  const { setCopilotOpen } = useUiStore()
  useEffect(() => { setCopilotOpen(true) }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="AI Copilot" />
      <div className="flex-1 relative overflow-hidden"><CopilotPanel /></div>
    </div>
  )
}
