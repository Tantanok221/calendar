import { describe, expect, test } from 'bun:test'
import type { CalendarEvent } from '../data/events'
import { filterVisibleCalendarEvents } from './calendarVisibility'

const EVENTS: CalendarEvent[] = [
  {
    id: 'work-1',
    title: 'Standup',
    date: '2026-03-31',
    startTime: '09:00',
    endTime: '09:30',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'personal-1',
    title: 'Gym',
    date: '2026-03-31',
    startTime: '18:00',
    endTime: '19:00',
    color: 'green',
    calendar: 'Personal'
  },
  {
    id: 'holiday-1',
    title: 'Public Holiday',
    date: '2026-03-31',
    allDay: true,
    color: 'orange',
    calendar: 'Holidays'
  }
]

describe('filterVisibleCalendarEvents', () => {
  test('excludes events whose calendar names are hidden', () => {
    expect(filterVisibleCalendarEvents(EVENTS, new Set(['Work', 'Holidays']))).toEqual([
      EVENTS[1]
    ])
  })

  test('returns all events when no calendars are hidden', () => {
    expect(filterVisibleCalendarEvents(EVENTS, new Set())).toEqual(EVENTS)
  })
})
