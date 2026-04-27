export async function invoke<T = any>(channel: string, data?: any): Promise<T> {
  const path = channel.replace(/:/g, '/')
  const res = await fetch(`/api/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? {})
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.error || message
    } catch {}
    throw new Error(message)
  }
  return res.json()
}

// subscribe is a no-op in the web version; SSE could be added later
export function subscribe(_channel: string, _listener: (...args: any[]) => void) {
  return () => {}
}
