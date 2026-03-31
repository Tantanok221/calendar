import { describe, expect, test } from 'bun:test'
import type { CalendarEvent } from '../data/events'
import type { RendererCalendar } from './googleCalendarSync'
import {
  getDefaultWritableCalendarId,
  getWritableCalendars,
  isCalendarEventEditable
} from './calendarPermissions'

const CALENDARS: RendererCalendar[] = [
  { id: 'primary', name: 'Work', color: 'violet', group: 'my' },
  { id: 'team', name: 'Team', color: 'green', group: 'my' },
  { id: 'readonly', name: 'Leadership', color: 'blue', group: 'other' }
]

describe('getWritableCalendars', () => {
  test('returns only calendars the user can edit', () => {
    expect(getWritableCalendars(CALENDARS)).toEqual([
      { id: 'primary', name: 'Work', color: 'violet', group: 'my' },
      { id: 'team', name: 'Team', color: 'green', group: 'my' }
    ])
  })
})

describe('getDefaultWritableCalendarId', () => {
  test('keeps the current selection when it is writable', () => {
    expect(getDefaultWritableCalendarId(CALENDARS, 'team')).toBe('team')
  })

  test('falls back to the first writable calendar when the current selection is read-only', () => {
    expect(getDefaultWritableCalendarId(CALENDARS, 'readonly')).toBe('primary')
  })

  test('returns an empty id when there are no writable calendars', () => {
    expect(
      getDefaultWritableCalendarId([{ id: 'readonly', name: 'Leadership', color: 'blue', group: 'other' }], 'readonly')
    ).toBe('')
  })
})

describe('isCalendarEventEditable', () => {
  test('treats local events as editable', () => {
    const event: CalendarEvent = {
      id: 'local:1',
      title: 'Draft',
      date: '2026-03-31',
      allDay: true,
      color: 'violet',
      calendar: 'Work'
    }

    expect(isCalendarEventEditable(event, CALENDARS)).toBe(true)
  })

  test('treats Google events on writable calendars as editable', () => {
    const event: CalendarEvent = {
      id: 'google:primary:evt-1',
      title: 'Standup',
      date: '2026-03-31',
      startTime: '09:00',
      endTime: '09:30',
      allDay: false,
      color: 'violet',
      calendar: 'Work',
      source: {
        provider: 'google',
        calendarId: 'primary',
        eventId: 'evt-1',
        timeZone: 'Asia/Kuala_Lumpur'
      }
    }

    expect(isCalendarEventEditable(event, CALENDARS)).toBe(true)
  })

  test('treats Google events on read-only calendars as non-editable', () => {
    const event: CalendarEvent = {
      id: 'google:readonly:evt-2',
      title: 'Leadership Sync',
      date: '2026-03-31',
      startTime: '11:00',
      endTime: '12:00',
      allDay: false,
      color: 'blue',
      calendar: 'Leadership',
      source: {
        provider: 'google',
        calendarId: 'readonly',
        eventId: 'evt-2',
        timeZone: 'Asia/Kuala_Lumpur'
      }
    }

    expect(isCalendarEventEditable(event, CALENDARS)).toBe(false)
  })
})
