import { describe, expect, test } from 'bun:test'
import type { CalendarEvent } from '../data/events'
import {
  buildCreateDraftFromCopiedEvent,
  isEventCopyShortcut,
  isEventPasteShortcut,
  type EventPasteTarget
} from './eventClipboard'

const COPIED_EVENT: CalendarEvent = {
  id: 'evt-1',
  title: 'Design Review',
  location: 'Room 201',
  date: '2026-03-31',
  startTime: '10:00',
  endTime: '11:00',
  color: 'violet',
  calendar: 'Work',
  source: {
    provider: 'google',
    calendarId: 'primary',
    eventId: 'evt-1',
    recurringEventId: 'series-1',
    timeZone: 'Asia/Kuala_Lumpur'
  }
}

const PASTE_TARGET: EventPasteTarget = {
  selectedDate: new Date(2026, 3, 2),
  allDay: false,
  startTime: '3:00 PM',
  endTime: '4:30 PM',
  calendarId: 'personal',
  calendarName: 'Personal',
  color: 'green'
}

describe('buildCreateDraftFromCopiedEvent', () => {
  test('copies event content into the current new-event target slot as a one-off event and preserves the copied duration', () => {
    expect(buildCreateDraftFromCopiedEvent(COPIED_EVENT, PASTE_TARGET)).toEqual({
      title: 'Design Review',
      location: 'Room 201',
      selectedDate: new Date(2026, 3, 2),
      allDay: false,
      startTime: '3:00 PM',
      endTime: '4:00 PM',
      calendarId: 'personal',
      calendarName: 'Personal',
      color: 'green',
      repeat: false,
      repeatFrequency: 'weekly',
      repeatDays: [],
      repeatEndType: 'date',
      repeatUntil: new Date(2026, 4, 2),
      repeatCount: 4
    })
  })

  test('keeps an all-day paste target all day even when the copied event is timed', () => {
    expect(
      buildCreateDraftFromCopiedEvent(COPIED_EVENT, {
        ...PASTE_TARGET,
        allDay: true
      })
    ).toMatchObject({
      selectedDate: new Date(2026, 3, 2),
      allDay: true,
      title: 'Design Review',
      location: 'Room 201'
    })
  })

  test('keeps the target end time when the copied event is all day', () => {
    expect(
      buildCreateDraftFromCopiedEvent(
        {
          ...COPIED_EVENT,
          allDay: true,
          startTime: undefined,
          endTime: undefined
        },
        PASTE_TARGET
      )
    ).toMatchObject({
      allDay: false,
      startTime: '3:00 PM',
      endTime: '4:30 PM'
    })
  })
})

describe('event clipboard shortcuts', () => {
  test('matches copy shortcuts only outside editable fields', () => {
    expect(isEventCopyShortcut(createKeyboardEventLike('c', { metaKey: true }))).toBe(true)
    expect(isEventCopyShortcut(createKeyboardEventLike('c', { ctrlKey: true }))).toBe(true)
    expect(
      isEventCopyShortcut(
        createKeyboardEventLike('c', {
          metaKey: true,
          target: { tagName: 'INPUT' } as EventTarget
        })
      )
    ).toBe(false)
    expect(isEventCopyShortcut(createKeyboardEventLike('c', { altKey: true }))).toBe(false)
  })

  test('allows paste shortcuts in editable fields when explicitly enabled', () => {
    expect(
      isEventPasteShortcut(
        createKeyboardEventLike('v', {
          metaKey: true,
          target: { tagName: 'INPUT' } as EventTarget
        }),
        { allowEditableTarget: true }
      )
    ).toBe(true)
    expect(
      isEventPasteShortcut(
        createKeyboardEventLike('v', {
          metaKey: true,
          target: { tagName: 'INPUT' } as EventTarget
        })
      )
    ).toBe(false)
  })
})

function createKeyboardEventLike(
  key: string,
  overrides: Partial<{
    key: string
    altKey: boolean
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
    target: EventTarget | null
    defaultPrevented: boolean
  }> = {}
): {
  key: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  target: EventTarget | null
  defaultPrevented: boolean
} {
  return {
    key,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    target: null,
    defaultPrevented: false,
    ...overrides
  }
}
