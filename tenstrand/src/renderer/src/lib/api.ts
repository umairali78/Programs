declare global {
  interface Window {
    api: {
      invoke: (channel: string, data?: any) => Promise<any>
      on: (channel: string, listener: (...args: any[]) => void) => void
      off: (channel: string, listener: (...args: any[]) => void) => void
    }
  }
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function invoke<T = any>(channel: string, data?: any): Promise<T> {
  const result: ApiResult<T> = await window.api.invoke(channel, data)
  if (!result.ok) throw new Error(result.error)
  return result.data
}

export function subscribe(channel: string, listener: (...args: any[]) => void) {
  window.api.on(channel, listener)
  return () => window.api.off(channel, listener)
}
