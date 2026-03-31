import { normalizeShortcut, type ShortcutKeys } from '../../../shared/shortcuts'

const SIDEBAR_SETTINGS_STORAGE_KEY = 'calendar.sidebar.settings'

export interface SidebarSettings {
  sidebarVisible: boolean
  toggleShortcut: ShortcutKeys | null
}

export interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export const DEFAULT_SIDEBAR_SETTINGS: SidebarSettings = {
  sidebarVisible: true,
  toggleShortcut: {
    modifiers: ['Control'],
    key: 'S'
  }
}

export function loadSidebarSettings(storage: StorageLike | null | undefined): SidebarSettings {
  if (!storage) {
    return DEFAULT_SIDEBAR_SETTINGS
  }

  const rawValue = storage.getItem(SIDEBAR_SETTINGS_STORAGE_KEY)

  if (!rawValue) {
    return DEFAULT_SIDEBAR_SETTINGS
  }

  try {
    const parsedValue = JSON.parse(rawValue) as {
      version?: unknown
      sidebarVisible?: unknown
      toggleShortcut?: unknown
    }

    if (parsedValue.version !== 1 || typeof parsedValue.sidebarVisible !== 'boolean') {
      return DEFAULT_SIDEBAR_SETTINGS
    }

    if (parsedValue.toggleShortcut === null) {
      return {
        sidebarVisible: parsedValue.sidebarVisible,
        toggleShortcut: null
      }
    }

    if (parsedValue.toggleShortcut === undefined) {
      return DEFAULT_SIDEBAR_SETTINGS
    }

    const toggleShortcut = normalizeShortcut(parsedValue.toggleShortcut)

    if (!toggleShortcut) {
      return DEFAULT_SIDEBAR_SETTINGS
    }

    return {
      sidebarVisible: parsedValue.sidebarVisible,
      toggleShortcut
    }
  } catch {
    return DEFAULT_SIDEBAR_SETTINGS
  }
}

export function saveSidebarSettings(
  storage: StorageLike | null | undefined,
  settings: SidebarSettings
): void {
  if (!storage) {
    return
  }

  storage.setItem(
    SIDEBAR_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      sidebarVisible: settings.sidebarVisible,
      toggleShortcut: normalizeShortcut(settings.toggleShortcut)
    })
  )
}
