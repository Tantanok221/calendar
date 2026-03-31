import { describe, expect, test } from 'bun:test'
import {
  getCalendarKeyboardAction,
  getNavigatedDate
} from './calendarKeyboard'

describe('calendar keyboard shortcuts', () => {
  test('moves the anchor date by the active view interval', () => {
    expect(getNavigatedDate(new Date(2026, 2, 31), 'day', 'prev')).toEqual(new Date(2026, 2, 30))
    expect(getNavigatedDate(new Date(2026, 2, 31), 'week', 'next')).toEqual(new Date(2026, 3, 7))
    expect(getNavigatedDate(new Date(2026, 2, 31), 'month', 'next')).toEqual(
      new Date(2026, 4, 1)
    )
  })

  test('maps arrow keys, view shortcuts, and today to actions', () => {
    expect(getCalendarKeyboardAction(createKeyboardEventLike('ArrowLeft'))).toEqual({
      type: 'navigate',
      direction: 'prev'
    })
    expect(getCalendarKeyboardAction(createKeyboardEventLike('ArrowRight'))).toEqual({
      type: 'navigate',
      direction: 'next'
    })
    expect(getCalendarKeyboardAction(createKeyboardEventLike('w'))).toEqual({
      type: 'set-view',
      view: 'week'
    })
    expect(getCalendarKeyboardAction(createKeyboardEventLike('D'))).toEqual({
      type: 'set-view',
      view: 'day'
    })
    expect(getCalendarKeyboardAction(createKeyboardEventLike('m'))).toEqual({
      type: 'set-view',
      view: 'month'
    })
    expect(getCalendarKeyboardAction(createKeyboardEventLike('t'))).toEqual({
      type: 'go-to-today'
    })
  })

  test('ignores shortcuts while typing in editable fields or when modifiers are held', () => {
    const editableTags = ['INPUT', 'TEXTAREA', 'SELECT']

    for (const tagName of editableTags) {
      expect(
        getCalendarKeyboardAction(createKeyboardEventLike('w', {
          target: { tagName } as EventTarget
        }))
      ).toBeNull()
    }

    expect(
      getCalendarKeyboardAction(
        createKeyboardEventLike('ArrowLeft', {
          target: { isContentEditable: true } as EventTarget
        })
      )
    ).toBeNull()
    expect(getCalendarKeyboardAction(createKeyboardEventLike('t', { metaKey: true }))).toBeNull()
    expect(getCalendarKeyboardAction(createKeyboardEventLike('m', { ctrlKey: true }))).toBeNull()
    expect(getCalendarKeyboardAction(createKeyboardEventLike('d', { altKey: true }))).toBeNull()
  })

  test('ignores unrelated keys', () => {
    expect(getCalendarKeyboardAction(createKeyboardEventLike('Enter'))).toBeNull()
  })
})

function createKeyboardEventLike(
  key: string,
  overrides: Partial<KeyboardEventLike> = {}
): KeyboardEventLike {
  return {
    key,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    target: null,
    ...overrides
  }
}

interface KeyboardEventLike {
  key: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  target: EventTarget | null
}
