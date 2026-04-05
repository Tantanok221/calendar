import { describe, expect, test } from 'bun:test'
import { shortcutFromKeyboardEvent } from './shortcuts'

describe('shared shortcut helpers', () => {
  test('records Option shortcuts on macOS using the physical key instead of the produced glyph', () => {
    expect(
      shortcutFromKeyboardEvent({
        key: 'ç',
        code: 'KeyC',
        altKey: true,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false
      })
    ).toEqual({
      modifiers: ['Alt'],
      key: 'C'
    })
  })
})
