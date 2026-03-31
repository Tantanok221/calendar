import { describe, expect, test } from 'bun:test'
import * as shortcuts from './shortcuts'

describe('desktop shortcut helpers', () => {
  test('builds an Electron accelerator from shortcut keys', () => {
    expect(typeof (shortcuts as Record<string, unknown>).toElectronAccelerator).toBe('function')

    const toElectronAccelerator = (
      shortcuts as Record<string, (...args: unknown[]) => unknown>
    ).toElectronAccelerator

    expect(
      toElectronAccelerator({
        shortcut: {
          modifiers: ['Meta', 'Shift'],
          key: 'B'
        },
        platform: 'darwin'
      })
    ).toBe('Command+Shift+B')
    expect(
      toElectronAccelerator({
        shortcut: {
          modifiers: ['Control', 'Alt'],
          key: 'K'
        },
        platform: 'win32'
      })
    ).toBe('Ctrl+Alt+K')
    expect(toElectronAccelerator({ shortcut: null, platform: 'darwin' })).toBeNull()
  })

  test('serializes and restores stored shortcut settings safely', () => {
    expect(typeof (shortcuts as Record<string, unknown>).serializeStoredShortcut).toBe('function')
    expect(typeof (shortcuts as Record<string, unknown>).deserializeStoredShortcut).toBe('function')

    const serializeStoredShortcut = (
      shortcuts as Record<string, (...args: unknown[]) => unknown>
    ).serializeStoredShortcut
    const deserializeStoredShortcut = (
      shortcuts as Record<string, (...args: unknown[]) => unknown>
    ).deserializeStoredShortcut

    expect(
      deserializeStoredShortcut(
        serializeStoredShortcut({
          modifiers: ['Shift', 'Meta'],
          key: 'b'
        })
      )
    ).toEqual({
      version: 1,
      floatingSidebar: {
        modifiers: ['Meta', 'Shift'],
        key: 'B'
      }
    })
    expect(deserializeStoredShortcut('{"version":1,"floatingSidebar":{"modifiers":["wat"],"key":"B"}}')).toBeNull()
    expect(deserializeStoredShortcut('not-json')).toBeNull()
  })
})
