import { describe, expect, test } from 'bun:test'
import * as panelWindow from './panelWindow'

describe('panel window helpers', () => {
  test('positions the panel on the right side of the active display work area', () => {
    expect(typeof (panelWindow as Record<string, unknown>).getPanelWindowBounds).toBe('function')

    const getPanelWindowBounds = (
      panelWindow as Record<string, (...args: unknown[]) => unknown>
    ).getPanelWindowBounds

    expect(
      getPanelWindowBounds({
        x: 0,
        y: 25,
        width: 1440,
        height: 900
      })
    ).toEqual({
      x: 852,
      y: 37,
      width: 576,
      height: 876
    })
    expect(
      getPanelWindowBounds({
        x: 1440,
        y: 0,
        width: 2560,
        height: 1440
      })
    ).toEqual({
      x: 3268,
      y: 12,
      width: 720,
      height: 1416
    })
  })

  test('reveals and focuses an already loaded panel window', () => {
    expect(typeof (panelWindow as Record<string, unknown>).revealPanelWindow).toBe('function')

    const revealPanelWindow = (
      panelWindow as Record<string, (...args: unknown[]) => unknown>
    ).revealPanelWindow

    const calls: string[] = []
    const workArea = { x: 0, y: 25, width: 1440, height: 900 }
    const window = createPanelWindowMock(calls, false)

    revealPanelWindow(window, workArea)

    expect(calls).toEqual([
      'setBounds',
      'setAlwaysOnTop:true:screen-saver',
      'moveTop',
      'show',
      'focus',
      'webContents.focus'
    ])
  })

  test('waits for load before showing and focusing a new panel window', () => {
    expect(typeof (panelWindow as Record<string, unknown>).revealPanelWindow).toBe('function')

    const revealPanelWindow = (
      panelWindow as Record<string, (...args: unknown[]) => unknown>
    ).revealPanelWindow

    const calls: string[] = []
    const workArea = { x: 0, y: 25, width: 1440, height: 900 }
    const window = createPanelWindowMock(calls, true)

    revealPanelWindow(window, workArea)

    expect(calls).toEqual([
      'setBounds',
      'setAlwaysOnTop:true:screen-saver',
      'moveTop',
      'webContents.once:did-finish-load'
    ])

    window.finishLoad?.()

    expect(calls).toEqual([
      'setBounds',
      'setAlwaysOnTop:true:screen-saver',
      'moveTop',
      'webContents.once:did-finish-load',
      'show',
      'focus',
      'webContents.focus'
    ])
  })
})

function createPanelWindowMock(calls: string[], isLoadingMainFrame: boolean) {
  let finishLoad: (() => void) | undefined

  return {
    finishLoad: undefined as (() => void) | undefined,
    setBounds: () => {
      calls.push('setBounds')
    },
    setAlwaysOnTop: (flag: boolean, level?: string) => {
      calls.push(`setAlwaysOnTop:${String(flag)}:${level ?? ''}`)
    },
    moveTop: () => {
      calls.push('moveTop')
    },
    show: () => {
      calls.push('show')
    },
    focus: () => {
      calls.push('focus')
    },
    webContents: {
      isLoadingMainFrame: () => isLoadingMainFrame,
      once: (_event: string, callback: () => void) => {
        calls.push('webContents.once:did-finish-load')
        finishLoad = callback
      },
      focus: () => {
        calls.push('webContents.focus')
      }
    },
    get finishLoad() {
      return finishLoad
    }
  }
}
