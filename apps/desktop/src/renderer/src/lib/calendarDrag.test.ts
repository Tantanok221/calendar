import { describe, expect, test } from 'bun:test'
import type { CalendarEvent } from '../data/events'
import {
  buildAllDayDropSlotId,
  buildTimedDraftFromSelection,
  buildDropSlotId,
  clampEventStartMinutes,
  getTimedDragPreviewRange,
  getTimedSelectionRange,
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

  test('expands an empty-slot drag downward from the pressed slot', () => {
    expect(getTimedSelectionRange(9 * 60, 10 * 60)).toEqual({
      startMinutes: 9 * 60,
      endMinutes: 10 * 60 + SNAP_MINUTES
    })
  })

  test('expands an empty-slot drag upward while keeping the pressed slot included', () => {
    expect(getTimedSelectionRange(10 * 60, 9 * 60)).toEqual({
      startMinutes: 9 * 60,
      endMinutes: 10 * 60 + SNAP_MINUTES
    })
  })

  test('uses a single snapped slot for a plain empty-slot click', () => {
    expect(getTimedSelectionRange(13 * 60 + 30, 13 * 60 + 30)).toEqual({
      startMinutes: 13 * 60 + 30,
      endMinutes: 14 * 60
    })
  })

  test('builds new-event modal defaults from a timed selection', () => {
    expect(
      buildTimedDraftFromSelection(new Date(2026, 2, 31), {
        startMinutes: 13 * 60 + 30,
        endMinutes: 15 * 60
      })
    ).toEqual({
      selectedDate: new Date(2026, 2, 31),
      allDay: false,
      startTime: '1:30 PM',
      endTime: '3:00 PM'
    })
  })

  test('builds a drag preview that preserves the dragged event duration', () => {
    expect(getTimedDragPreviewRange(9 * 60 + 30, 60)).toEqual({
      startMinutes: 9 * 60 + 30,
      endMinutes: 10 * 60 + 30
    })
  })

  test('clamps the drag preview so long events stay within visible hours', () => {
    expect(getTimedDragPreviewRange(20 * 60 + 30, 90, 7 * 60, 21 * 60)).toEqual({
      startMinutes: 19 * 60 + 30,
      endMinutes: 21 * 60
    })
  })
})
