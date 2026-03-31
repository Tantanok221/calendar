import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { normalizeShortcut, type ShortcutKeys } from '../shared/shortcuts'

export interface StoredDesktopShortcuts {
  version: 1
  floatingSidebar: ShortcutKeys | null
}

export interface FloatingSidebarShortcutState {
  shortcut: ShortcutKeys | null
  registered: boolean
  errorMessage: string | null
}

const DEFAULT_STORED_DESKTOP_SHORTCUTS: StoredDesktopShortcuts = {
  version: 1,
  floatingSidebar: null
}

interface FileDesktopShortcutStoreOptions {
  filePath: string
}

export function serializeStoredShortcut(shortcut: ShortcutKeys | null): string {
  return JSON.stringify(buildStoredDesktopShortcuts(shortcut))
}

export function deserializeStoredShortcut(rawShortcut: string): StoredDesktopShortcuts | null {
  try {
    const parsedShortcut = JSON.parse(rawShortcut) as {
      version?: unknown
      floatingSidebar?: unknown
    }

    if (parsedShortcut.version !== 1) {
      return null
    }

    if (parsedShortcut.floatingSidebar === null || parsedShortcut.floatingSidebar === undefined) {
      return DEFAULT_STORED_DESKTOP_SHORTCUTS
    }

    const floatingSidebar = normalizeShortcut(parsedShortcut.floatingSidebar)

    if (!floatingSidebar) {
      return null
    }

    return {
      version: 1,
      floatingSidebar
    }
  } catch {
    return null
  }
}

export function toElectronAccelerator({
  shortcut,
  platform = process.platform
}: {
  shortcut: ShortcutKeys | null
  platform?: NodeJS.Platform
}): string | null {
  const normalizedShortcut = normalizeShortcut(shortcut)

  if (!normalizedShortcut) {
    return null
  }

  const modifiers = normalizedShortcut.modifiers.map((modifier) =>
    modifier === 'Meta' ? (platform === 'darwin' ? 'Command' : 'Super') : formatModifier(modifier)
  )

  return [...modifiers, formatAcceleratorKey(normalizedShortcut.key)].join('+')
}

export class FileDesktopShortcutStore {
  constructor(private readonly options: FileDesktopShortcutStoreOptions) {}

  async load(): Promise<StoredDesktopShortcuts> {
    try {
      const rawValue = await readFile(this.options.filePath, 'utf8')
      return deserializeStoredShortcut(rawValue) ?? DEFAULT_STORED_DESKTOP_SHORTCUTS
    } catch (error) {
      if (isMissingFileError(error)) {
        return DEFAULT_STORED_DESKTOP_SHORTCUTS
      }

      throw error
    }
  }

  async saveFloatingSidebarShortcut(shortcut: ShortcutKeys | null): Promise<StoredDesktopShortcuts> {
    await mkdir(dirname(this.options.filePath), { recursive: true })

    const storedShortcuts = buildStoredDesktopShortcuts(shortcut)
    await writeFile(this.options.filePath, JSON.stringify(storedShortcuts), 'utf8')

    return storedShortcuts
  }
}

function buildStoredDesktopShortcuts(shortcut: ShortcutKeys | null): StoredDesktopShortcuts {
  return {
    version: 1,
    floatingSidebar: normalizeShortcut(shortcut)
  }
}

function formatModifier(modifier: Exclude<ShortcutKeys['modifiers'][number], 'Meta'>): string {
  if (modifier === 'Control') {
    return 'Ctrl'
  }

  return modifier
}

function formatAcceleratorKey(key: string): string {
  switch (key) {
    case 'ARROWLEFT':
      return 'Left'
    case 'ARROWRIGHT':
      return 'Right'
    case 'ARROWUP':
      return 'Up'
    case 'ARROWDOWN':
      return 'Down'
    case 'ESCAPE':
      return 'Esc'
    default:
      return key
  }
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}
