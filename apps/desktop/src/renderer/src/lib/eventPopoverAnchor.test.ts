import { describe, expect, test } from 'bun:test'
import { computeAnchorFromTimedSelectionRect } from './eventPopoverAnchor'

function mockWindow(): void {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      innerWidth: 1280,
      innerHeight: 900
    }
  })
}

describe('event popover anchors', () => {
  test('anchors a new-event popover to the right side of the timed selection when there is room', () => {
    mockWindow()

    expect(
      computeAnchorFromTimedSelectionRect({
        left: 300,
        right: 420,
        top: 240,
        bottom: 336
      })
    ).toEqual({
      top: 240,
      left: 432
    })
  })

  test('anchors a new-event popover to the left side of the timed selection when the right side is cramped', () => {
    mockWindow()

    expect(
      computeAnchorFromTimedSelectionRect({
        left: 980,
        right: 1100,
        top: 240,
        bottom: 336
      })
    ).toEqual({
      top: 240,
      left: 628
    })
  })
})
