import { describe, expect, test } from 'bun:test'
import * as calendarKeyboard from './calendarKeyboard'

const { getCalendarKeyboardAction, getNavigatedDate } = calendarKeyboard

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

  test('matches an exact custom shortcut outside editable fields', () => {
    expect(typeof (calendarKeyboard as Record<string, unknown>).matchesShortcut).toBe('function')

    const matchesShortcut = (calendarKeyboard as Record<string, (...args: unknown[]) => unknown>)
      .matchesShortcut

    expect(
      matchesShortcut(
        createKeyboardEventLike('b', {
          metaKey: true,
          shiftKey: true
        }),
        {
          modifiers: ['Meta', 'Shift'],
          key: 'B'
        }
      )
    ).toBe(true)
    expect(
      matchesShortcut(
        createKeyboardEventLike('b', {
          metaKey: true
        }),
        {
          modifiers: ['Meta', 'Shift'],
          key: 'B'
        }
      )
    ).toBe(false)
    expect(
      matchesShortcut(
        createKeyboardEventLike('b', {
          metaKey: true,
          shiftKey: true,
          target: { tagName: 'INPUT' } as EventTarget
        }),
        {
          modifiers: ['Meta', 'Shift'],
          key: 'B'
        }
      )
    ).toBe(false)
  })

  test('normalizes and restores a stored shortcut payload safely', () => {
    expect(typeof (calendarKeyboard as Record<string, unknown>).serializeShortcut).toBe('function')
    expect(typeof (calendarKeyboard as Record<string, unknown>).parseShortcut).toBe('function')

    const serializeShortcut = (calendarKeyboard as Record<string, (...args: unknown[]) => unknown>)
      .serializeShortcut
    const parseShortcut = (calendarKeyboard as Record<string, (...args: unknown[]) => unknown>)
      .parseShortcut

    expect(
      parseShortcut(
        serializeShortcut({
          modifiers: ['Shift', 'Meta'],
          key: 'b'
        })
      )
    ).toEqual({
      modifiers: ['Meta', 'Shift'],
      key: 'B'
    })
    expect(parseShortcut('{"modifiers":["wat"],"key":1}')).toBeNull()
    expect(parseShortcut('not-json')).toBeNull()
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
