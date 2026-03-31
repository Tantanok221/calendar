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
})
