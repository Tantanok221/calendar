import { describe, expect, test } from 'bun:test'
import type { CalendarEvent } from '../data/events'
import {
  buildAllDayDropSlotId,
  buildDropSlotId,
  clampEventStartMinutes,
  getDateFromColumnIndex,
  parseDropSlotId,
  rescheduleAllDayEvent,
  rescheduleTimedEvent,
  SNAP_MINUTES
} from './calendarDrag'

const BASE_EVENT: CalendarEvent = {
  id: 'evt-1',
  title: 'Design Review',
  date: '2026-03-28',
  startTime: '14:00',
  endTime: '15:30',
  color: 'blue',
  calendar: 'Work'
}

describe('calendar drag helpers', () => {
  test('uses 30 minute snapping for drag moves', () => {
    expect(SNAP_MINUTES).toBe(30)
  })

  test('reschedules a timed event and preserves its duration', () => {
    expect(
      rescheduleTimedEvent(BASE_EVENT, {
        date: new Date(2026, 2, 29),
        startMinutes: 9 * 60 + 30
      })
    ).toMatchObject({
      date: '2026-03-29',
      startTime: '09:30',
      endTime: '11:00'
    })
  })

  test('clamps the dragged start time so the event still fits in the visible hours', () => {
    expect(clampEventStartMinutes(20 * 60 + 45, 90, 7 * 60, 21 * 60)).toBe(19 * 60 + 30)
  })

  test('maps a week-view column index to the corresponding day', () => {
    const date = getDateFromColumnIndex(new Date(2026, 2, 23), 3)

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(2)
    expect(date.getDate()).toBe(26)
  })

  test('serializes and parses drop slot ids for dnd targets', () => {
    const slotId = buildDropSlotId('week', new Date(2026, 2, 29), 9 * 60 + 30)

    expect(parseDropSlotId(slotId)).toEqual({
      view: 'week',
      date: '2026-03-29',
      startMinutes: 9 * 60 + 30,
      lane: 'timed'
    })
  })

  test('serializes and parses all-day drop slot ids for dnd targets', () => {
    const slotId = buildAllDayDropSlotId('week', new Date(2026, 2, 29))

    expect(parseDropSlotId(slotId)).toEqual({
      view: 'week',
      date: '2026-03-29',
      startMinutes: null,
      lane: 'all-day'
    })
  })

  test('reschedules an all-day event by changing only its date', () => {
    expect(
      rescheduleAllDayEvent(
        {
          ...BASE_EVENT,
          allDay: true,
          startTime: undefined,
          endTime: undefined
        },
        new Date(2026, 2, 30)
      )
    ).toMatchObject({
      date: '2026-03-30',
      allDay: true,
      startTime: undefined,
      endTime: undefined
    })
  })
})
