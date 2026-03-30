import { describe, expect, test } from 'bun:test'
import {
  buildGoogleCalendarUpdateFromRendererEvent,
  isGoogleBackedCalendarEvent
} from './googleCalendarWriteback'

describe('isGoogleBackedCalendarEvent', () => {
  test('detects Google-backed renderer events', () => {
    expect(
      isGoogleBackedCalendarEvent({
        id: 'google:primary:evt-1',
        title: 'Standup',
        date: '2026-03-30',
        startTime: '09:00',
        endTime: '09:30',
        color: 'violet',
        calendar: 'Work',
        source: {
          provider: 'google',
          calendarId: 'primary',
          eventId: 'evt-1',
          timeZone: 'Asia/Kuala_Lumpur'
        }
      })
    ).toBe(true)
  })

  test('ignores local mock events', () => {
    expect(
      isGoogleBackedCalendarEvent({
        id: 'e1',
        title: 'Standup',
        date: '2026-03-30',
        startTime: '09:00',
        endTime: '09:30',
        color: 'violet',
        calendar: 'Work'
      })
    ).toBe(false)
  })
})

describe('buildGoogleCalendarUpdateFromRendererEvent', () => {
  test('translates a dragged timed event into a Google update payload', () => {
    expect(
      buildGoogleCalendarUpdateFromRendererEvent({
        id: 'google:primary:evt-1',
        title: 'Standup',
        date: '2026-03-30',
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
      })
    ).toEqual({
      calendarId: 'primary',
      eventId: 'evt-1',
      start: {
        dateTime: '2026-03-30T09:00:00.000',
        date: null,
        timeZone: 'Asia/Kuala_Lumpur'
      },
      end: {
        dateTime: '2026-03-30T09:30:00.000',
        date: null,
        timeZone: 'Asia/Kuala_Lumpur'
      }
    })
  })

  test('returns null for events that cannot be written back', () => {
    expect(
      buildGoogleCalendarUpdateFromRendererEvent({
        id: 'google:primary:evt-1:0',
        title: 'Offsite',
        date: '2026-03-30',
        allDay: false,
        color: 'violet',
        calendar: 'Work',
        source: {
          provider: 'google',
          calendarId: 'primary',
          eventId: 'evt-1',
          timeZone: 'Asia/Kuala_Lumpur'
        }
      })
    ).toBeNull()
  })

  test('supports single-day all-day events', () => {
    expect(
      buildGoogleCalendarUpdateFromRendererEvent({
        id: 'google:primary:evt-2',
        title: 'Offsite',
        date: '2026-03-30',
        allDay: true,
        color: 'violet',
        calendar: 'Work',
        source: {
          provider: 'google',
          calendarId: 'primary',
          eventId: 'evt-2',
          timeZone: null
        }
      })
    ).toEqual({
      calendarId: 'primary',
      eventId: 'evt-2',
      start: {
        dateTime: null,
        date: '2026-03-30',
        timeZone: null
      },
      end: {
        dateTime: null,
        date: '2026-03-31',
        timeZone: null
      }
    })
  })
})
