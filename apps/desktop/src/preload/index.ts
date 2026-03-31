import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { DesktopApi } from './api'

// Custom APIs for renderer
const api: DesktopApi = {
  googleCalendar: {
    getStatus: () => ipcRenderer.invoke('google-calendar:get-status'),
    connect: () => ipcRenderer.invoke('google-calendar:connect'),
    disconnect: () => ipcRenderer.invoke('google-calendar:disconnect'),
    listCalendars: () => ipcRenderer.invoke('google-calendar:list-calendars'),
    listEvents: (input) => ipcRenderer.invoke('google-calendar:list-events', input),
    updateEvent: (input) => ipcRenderer.invoke('google-calendar:update-event', input),
    moveEvent: (input) => ipcRenderer.invoke('google-calendar:move-event', input),
    deleteEvent: (input) => ipcRenderer.invoke('google-calendar:delete-event', input),
    createEvent: (input) => ipcRenderer.invoke('google-calendar:create-event', input)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
