import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { GoogleCalendarService } from './googleCalendar/service'
import { loadDesktopRootEnv, resolveDesktopDirFromMainFile } from './env'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 980,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1a1916',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await loadDesktopRootEnv(resolveDesktopDirFromMainFile(__dirname))

  electronApp.setAppUserModelId('com.calendar.desktop')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const googleCalendarService = new GoogleCalendarService()

  ipcMain.handle('google-calendar:get-status', () => googleCalendarService.getStatus())
  ipcMain.handle('google-calendar:connect', () => googleCalendarService.connect())
  ipcMain.handle('google-calendar:disconnect', async () => {
    await googleCalendarService.disconnect()
  })
  ipcMain.handle('google-calendar:list-calendars', () => googleCalendarService.listCalendars())
  ipcMain.handle('google-calendar:list-events', (_, input) => googleCalendarService.listEvents(input))
  ipcMain.handle('google-calendar:update-event', (_, input) => googleCalendarService.updateEvent(input))
  ipcMain.handle('google-calendar:create-event', (_, input) => googleCalendarService.createEvent(input))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
