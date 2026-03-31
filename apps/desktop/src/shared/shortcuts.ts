const SHORTCUT_MODIFIER_ORDER = ['Meta', 'Control', 'Alt', 'Shift'] as const

export type ShortcutModifier = (typeof SHORTCUT_MODIFIER_ORDER)[number]

export interface ShortcutKeys {
  modifiers: ShortcutModifier[]
  key: string
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

export function normalizeShortcutKey(key: string): string {
  return key.trim().toUpperCase()
}

function isShortcutModifier(value: unknown): value is ShortcutModifier {
  return SHORTCUT_MODIFIER_ORDER.includes(value as ShortcutModifier)
}
