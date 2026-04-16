import { contextBridge, ipcRenderer } from 'electron'

const api = {
  invoke: (channel: string, data?: any, token?: string) =>
    ipcRenderer.invoke(channel, { token, data }),

  on: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => listener(...args))
  },

  off: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)

// Type declarations for renderer
export type ApiType = typeof api
