const SHORTCUT_MODIFIER_ORDER = ['Meta', 'Control', 'Alt', 'Shift'] as const

export type ShortcutModifier = (typeof SHORTCUT_MODIFIER_ORDER)[number]

export interface ShortcutKeys {
  modifiers: ShortcutModifier[]
  key: string
}

export interface ShortcutKeyboardEventLike {
  key: string
  code?: string
  metaKey: boolean
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
}

export function normalizeShortcut(
  shortcut: ShortcutKeys | { modifiers?: unknown; key?: unknown } | null
): ShortcutKeys | null {
  if (!shortcut || typeof shortcut.key !== 'string' || !Array.isArray(shortcut.modifiers)) {
    return null
  }

  const modifiers = shortcut.modifiers.filter(isShortcutModifier)

  if (modifiers.length !== shortcut.modifiers.length) {
    return null
  }

  const key = normalizeShortcutKey(shortcut.key)

  if (!key) {
    return null
  }

  return {
    modifiers: SHORTCUT_MODIFIER_ORDER.filter((modifier) => modifiers.includes(modifier)),
    key
  }
}

export function serializeShortcut(shortcut: ShortcutKeys | null): string | null {
  const normalizedShortcut = normalizeShortcut(shortcut)

  if (!normalizedShortcut) {
    return null
  }

  return JSON.stringify(normalizedShortcut)
}

export function parseShortcut(rawShortcut: string | null): ShortcutKeys | null {
  if (!rawShortcut) {
    return null
  }

  try {
    const parsedShortcut = JSON.parse(rawShortcut)

    return normalizeShortcut(parsedShortcut)
  } catch {
    return null
  }
}

export function shortcutFromKeyboardEvent(event: ShortcutKeyboardEventLike): ShortcutKeys | null {
  if (['Meta', 'Control', 'Alt', 'Shift'].includes(event.key)) {
    return null
  }

  const modifiers: ShortcutModifier[] = []

  if (event.metaKey) modifiers.push('Meta')
  if (event.ctrlKey) modifiers.push('Control')
  if (event.altKey) modifiers.push('Alt')
  if (event.shiftKey) modifiers.push('Shift')

  const key = event.altKey ? normalizeShortcutCode(event.code) ?? normalizeShortcutKey(event.key) : normalizeShortcutKey(event.key)

  return normalizeShortcut({ modifiers, key })
}

export function normalizeShortcutKey(key: string): string {
  return key.trim().toUpperCase()
}

function normalizeShortcutCode(code: string | undefined): string | null {
  if (!code) {
    return null
  }

  const keyMatch = /^Key([A-Z])$/.exec(code)

  if (keyMatch) {
    return keyMatch[1]
  }

  const digitMatch = /^Digit([0-9])$/.exec(code)

  if (digitMatch) {
    return digitMatch[1]
  }

  return null
}

function isShortcutModifier(value: unknown): value is ShortcutModifier {
  return SHORTCUT_MODIFIER_ORDER.includes(value as ShortcutModifier)
}
