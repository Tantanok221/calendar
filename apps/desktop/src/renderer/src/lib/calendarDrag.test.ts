import { describe, expect, test } from 'bun:test'
import { HOUR_HEIGHT } from '../data/events'
import type { CalendarEvent } from '../data/events'
import {
  buildAllDayDraftFromDate,
  buildAllDayDropSlotId,
  buildTimedDraftFromSelection,
  buildDropSlotId,
  clampEventStartMinutes,
  getTimedDragPreviewRange,
  getTimedResizeBoundaryMinutes,
  getTimedSelectionRange,
  getDateFromColumnIndex,
  parseDropSlotId,
  rescheduleAllDayEvent,
  resizeTimedEvent,
  resizeTimedSelectionRange,
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

  test('builds new-event modal defaults for an all-day date click', () => {
    expect(buildAllDayDraftFromDate(new Date(2026, 2, 31))).toEqual({
      selectedDate: new Date(2026, 2, 31),
      allDay: true,
      startTime: '10:00 AM',
      endTime: '11:00 AM'
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

  test('snaps a resize pointer position to the nearest visible boundary', () => {
    expect(getTimedResizeBoundaryMinutes(HOUR_HEIGHT * 2.2, HOUR_HEIGHT, 7 * 60, 21 * 60)).toBe(
      9 * 60
    )
    expect(getTimedResizeBoundaryMinutes(HOUR_HEIGHT * 2.6, HOUR_HEIGHT, 7 * 60, 21 * 60)).toBe(
      9 * 60 + 30
    )
  })

  test('extends a timed event from its end edge', () => {
    expect(
      resizeTimedEvent(BASE_EVENT, {
        edge: 'end',
        boundaryMinutes: 17 * 60
      })
    ).toMatchObject({
      startTime: '14:00',
      endTime: '17:00'
    })
  })

  test('moves a timed event start from its top edge', () => {
    expect(
      resizeTimedEvent(BASE_EVENT, {
        edge: 'start',
        boundaryMinutes: 13 * 60
      })
    ).toMatchObject({
      startTime: '13:00',
      endTime: '15:30'
    })
  })

  test('keeps at least one snap interval when shrinking from the start edge', () => {
    expect(
      resizeTimedEvent(BASE_EVENT, {
        edge: 'start',
        boundaryMinutes: 15 * 60 + 30
      })
    ).toMatchObject({
      startTime: '15:00',
      endTime: '15:30'
    })
  })

  test('keeps at least one snap interval when shrinking from the end edge', () => {
    expect(
      resizeTimedEvent(BASE_EVENT, {
        edge: 'end',
        boundaryMinutes: 13 * 60
      })
    ).toMatchObject({
      startTime: '14:00',
      endTime: '14:30'
    })
  })

  test('clamps resized times to the visible hours', () => {
    expect(
      resizeTimedEvent(BASE_EVENT, {
        edge: 'start',
        boundaryMinutes: 6 * 60,
        dayStartMinutes: 7 * 60,
        dayEndMinutes: 21 * 60
      })
    ).toMatchObject({
      startTime: '07:00',
      endTime: '15:30'
    })

    expect(
      resizeTimedEvent(BASE_EVENT, {
        edge: 'end',
        boundaryMinutes: 23 * 60,
        dayStartMinutes: 7 * 60,
        dayEndMinutes: 21 * 60
      })
    ).toMatchObject({
      startTime: '14:00',
      endTime: '21:00'
    })
  })

  test('moves a new-event preview start from its top edge', () => {
    expect(
      resizeTimedSelectionRange(
        {
          startMinutes: 14 * 60,
          endMinutes: 15 * 60 + 30
        },
        {
          edge: 'start',
          boundaryMinutes: 13 * 60 + 30
        }
      )
    ).toEqual({
      startMinutes: 13 * 60 + 30,
      endMinutes: 15 * 60 + 30
    })
  })

  test('moves a new-event preview end from its bottom edge', () => {
    expect(
      resizeTimedSelectionRange(
        {
          startMinutes: 14 * 60,
          endMinutes: 15 * 60
        },
        {
          edge: 'end',
          boundaryMinutes: 16 * 60
        }
      )
    ).toEqual({
      startMinutes: 14 * 60,
      endMinutes: 16 * 60
    })
  })

  test('keeps a new-event preview at least one snap interval tall while resizing', () => {
    expect(
      resizeTimedSelectionRange(
        {
          startMinutes: 14 * 60,
          endMinutes: 15 * 60
        },
        {
          edge: 'start',
          boundaryMinutes: 15 * 60 + 30
        }
      )
    ).toEqual({
      startMinutes: 14 * 60 + 30,
      endMinutes: 15 * 60
    })

    expect(
      resizeTimedSelectionRange(
        {
          startMinutes: 14 * 60,
          endMinutes: 15 * 60
        },
        {
          edge: 'end',
          boundaryMinutes: 13 * 60
        }
      )
    ).toEqual({
      startMinutes: 14 * 60,
      endMinutes: 14 * 60 + 30
    })
  })
})
