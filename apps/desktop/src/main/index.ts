import { app, shell, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { GoogleCalendarService } from './googleCalendar/service'
import {
  FileDesktopShortcutStore,
  toElectronAccelerator,
  type FloatingSidebarShortcutState
} from './shortcuts'
import {
  normalizeShortcut,
  type ShortcutKeys
} from '../shared/shortcuts'
import { getPanelWindowBounds } from './panelWindow'

const SHORTCUT_FILE_NAME = 'shortcuts.json'

let mainWindow: BrowserWindow | null = null
let panelWindow: BrowserWindow | null = null
let floatingSidebarShortcut: ShortcutKeys | null = null
let floatingSidebarShortcutRegistered = false
let floatingSidebarShortcutErrorMessage: string | null = null
const desktopShortcutStore = new FileDesktopShortcutStore({
  filePath: join(app.getPath('userData'), SHORTCUT_FILE_NAME)
})

function createWindow(): BrowserWindow {
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

  mainWindow.on('closed', () => {
    if (mainWindow === getMainWindow()) {
      setMainWindow(null)
    }
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

  setMainWindow(mainWindow)

  return mainWindow
}

function createPanelWindow(): BrowserWindow {
  const panelWindow = new BrowserWindow({
    ...getPanelWindowBounds(
      screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
    ),
    show: false,
    frame: false,
    transparent: false,
    hasShadow: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    backgroundColor: '#211f1a',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  panelWindow.on('closed', () => {
    if (panelWindow === getPanelWindow()) {
      setPanelWindow(null)
    }
  })

  panelWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    panelWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?window=panel`)
  } else {
    panelWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      search: 'window=panel'
    })
  }

  panelWindow.setAlwaysOnTop(true, 'screen-saver')
  panelWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  setPanelWindow(panelWindow)

  return panelWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.stride.desktop')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const googleCalendarService = new GoogleCalendarService()
  const storedShortcuts = await desktopShortcutStore.load()
  registerFloatingSidebarShortcut(storedShortcuts.floatingSidebar, { source: 'stored' })

  ipcMain.handle('google-calendar:get-status', () => googleCalendarService.getStatus())
  ipcMain.handle('google-calendar:connect', () => googleCalendarService.connect())
  ipcMain.handle('google-calendar:disconnect', async () => {
    await googleCalendarService.disconnect()
  })
  ipcMain.handle('google-calendar:list-calendars', () => googleCalendarService.listCalendars())
  ipcMain.handle('google-calendar:list-events', (_, input) => googleCalendarService.listEvents(input))
  ipcMain.handle('google-calendar:update-event', (_, input) => googleCalendarService.updateEvent(input))
  ipcMain.handle('google-calendar:move-event', (_, input) => googleCalendarService.moveEvent(input))
  ipcMain.handle('google-calendar:delete-event', (_, input) => googleCalendarService.deleteEvent(input))
  ipcMain.handle('google-calendar:create-event', (_, input) => googleCalendarService.createEvent(input))
  ipcMain.handle('shortcuts:get-floating-sidebar-shortcut', () => getFloatingSidebarShortcutState())
  ipcMain.handle('shortcuts:set-floating-sidebar-shortcut', async (_, shortcut) => {
    const shortcutState = registerFloatingSidebarShortcut(shortcut, { source: 'user' })

    if (shortcutState.errorMessage) {
      return shortcutState
    }

    await desktopShortcutStore.saveFloatingSidebarShortcut(shortcutState.shortcut)

    return shortcutState
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window
}

function getPanelWindow(): BrowserWindow | null {
  return panelWindow
}

function setPanelWindow(window: BrowserWindow | null): void {
  panelWindow = window
}

function toggleFloatingSidebarFromGlobalShortcut(): void {
  const existingPanelWindow = getPanelWindow()

  if (existingPanelWindow && !existingPanelWindow.isDestroyed() && existingPanelWindow.isVisible()) {
    existingPanelWindow.hide()
    return
  }

  const window = existingPanelWindow && !existingPanelWindow.isDestroyed()
    ? existingPanelWindow
    : createPanelWindow()
  const nextBounds = getPanelWindowBounds(
    screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  )

  window.setBounds(nextBounds)
  window.setAlwaysOnTop(true, 'screen-saver')
  window.moveTop()

  if (window.webContents.isLoadingMainFrame()) {
    window.webContents.once('did-finish-load', () => {
      window.showInactive()
    })
    return
  }

  window.showInactive()
}

function registerFloatingSidebarShortcut(
  shortcut: ShortcutKeys | null,
  options: { source: 'stored' | 'user' }
): FloatingSidebarShortcutState {
  const nextShortcut = normalizeShortcut(shortcut)
  const nextAccelerator = toElectronAccelerator({ shortcut: nextShortcut })
  const currentAccelerator = toElectronAccelerator({ shortcut: floatingSidebarShortcut })

  if (!nextAccelerator) {
    if (currentAccelerator) {
      globalShortcut.unregister(currentAccelerator)
    }

    floatingSidebarShortcut = null
    floatingSidebarShortcutRegistered = true
    floatingSidebarShortcutErrorMessage = null

    return buildFloatingSidebarShortcutState(null, true, null)
  }

  if (
    currentAccelerator === nextAccelerator &&
    floatingSidebarShortcutRegistered &&
    floatingSidebarShortcut
  ) {
    floatingSidebarShortcut = nextShortcut
    floatingSidebarShortcutErrorMessage = null

    return buildFloatingSidebarShortcutState(floatingSidebarShortcut, true, null)
  }

  const previousShortcut = floatingSidebarShortcut
  const previousAccelerator = currentAccelerator
  const previousRegistered = floatingSidebarShortcutRegistered

  if (currentAccelerator && currentAccelerator !== nextAccelerator) {
    globalShortcut.unregister(currentAccelerator)
  }

  const registered = globalShortcut.register(nextAccelerator, toggleFloatingSidebarFromGlobalShortcut)

  if (!registered) {
    if (previousAccelerator && previousRegistered) {
      globalShortcut.register(previousAccelerator, toggleFloatingSidebarFromGlobalShortcut)
    }

    floatingSidebarShortcutErrorMessage = 'This global shortcut is unavailable.'

    if (options.source === 'stored') {
      floatingSidebarShortcut = nextShortcut
      floatingSidebarShortcutRegistered = false

      return buildFloatingSidebarShortcutState(
        floatingSidebarShortcut,
        floatingSidebarShortcutRegistered,
        floatingSidebarShortcutErrorMessage
      )
    }

    floatingSidebarShortcut = previousShortcut
    floatingSidebarShortcutRegistered = previousRegistered

    return buildFloatingSidebarShortcutState(
      previousShortcut,
      previousRegistered,
      floatingSidebarShortcutErrorMessage
    )
  }

  floatingSidebarShortcut = nextShortcut
  floatingSidebarShortcutRegistered = true
  floatingSidebarShortcutErrorMessage = null

  return buildFloatingSidebarShortcutState(floatingSidebarShortcut, true, null)
}

function getFloatingSidebarShortcutState(): FloatingSidebarShortcutState {
  return buildFloatingSidebarShortcutState(
    floatingSidebarShortcut,
    floatingSidebarShortcutRegistered,
    floatingSidebarShortcutErrorMessage
  )
}

function buildFloatingSidebarShortcutState(
  shortcut: ShortcutKeys | null,
  registered: boolean,
  errorMessage: string | null
): FloatingSidebarShortcutState {
  return {
    shortcut,
    registered,
    errorMessage
  }
}
