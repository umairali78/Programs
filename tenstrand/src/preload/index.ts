import { contextBridge, ipcRenderer } from 'electron'

const api = {
  invoke: (channel: string, data?: any) =>
    ipcRenderer.invoke(channel, { data }),

  on: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => listener(...args))
  },

  off: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ApiType = typeof api
