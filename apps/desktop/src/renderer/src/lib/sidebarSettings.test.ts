import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_SIDEBAR_SETTINGS,
  loadSidebarSettings,
  saveSidebarSettings
} from './sidebarSettings'

describe('sidebar settings', () => {
  test('loads the default settings when storage is empty or invalid', () => {
    expect(loadSidebarSettings(new MemoryStorage())).toEqual(DEFAULT_SIDEBAR_SETTINGS)

    const storage = new MemoryStorage({
      'calendar.sidebar.settings': '{"sidebarVisible":"yes"}'
    })

    expect(loadSidebarSettings(storage)).toEqual(DEFAULT_SIDEBAR_SETTINGS)
  })

  test('persists the sidebar visibility and toggle shortcut', () => {
    const storage = new MemoryStorage()
    const customShortcut = {
      modifiers: ['Meta', 'Shift'] as const,
      key: 'B'
    }

    saveSidebarSettings(storage, {
      sidebarVisible: false,
      toggleShortcut: customShortcut
    })

    expect(loadSidebarSettings(storage)).toEqual({
      sidebarVisible: false,
      toggleShortcut: customShortcut
    })
  })

  test('defaults the toggle shortcut to Control + S', () => {
    expect(DEFAULT_SIDEBAR_SETTINGS.toggleShortcut).toEqual({
      modifiers: ['Control'],
      key: 'S'
    })
  })
})

class MemoryStorage {
  private readonly values = new Map<string, string>()

  constructor(initialValues: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initialValues)) {
      this.values.set(key, value)
    }
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}
