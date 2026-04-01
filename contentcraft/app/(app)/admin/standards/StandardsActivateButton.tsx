'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StandardsActivateButton({ guideId, chunkCount }: { guideId: string; chunkCount: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const activate = async () => {
    if (chunkCount === 0) {
      alert('This guide has no chunks yet — embedding may still be in progress.')
      return
    }
    setLoading(true)
    await fetch(`/api/standards/${guideId}/activate`, { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button className="btn-secondary text-xs py-1 px-2" onClick={activate} disabled={loading}>
      {loading ? 'Activating...' : 'Activate'}
    </button>
  )
}
