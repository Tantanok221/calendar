import { describe, expect, test } from 'bun:test'
import {
  buildGoogleCalendarPresentation,
  getGoogleCalendarSyncRange
} from './googleCalendarSync'

describe('buildGoogleCalendarPresentation', () => {
  test('maps timed Google events into renderer events using calendar summaries', () => {
    const presentation = buildGoogleCalendarPresentation(
      [
        {
          id: 'primary',
          summary: 'Work',
          description: null,
          primary: true,
          backgroundColor: null,
          foregroundColor: null,
          timeZone: 'Asia/Kuala_Lumpur'
        }
      ],
      [
        {
          id: 'evt-1',
          calendarId: 'primary',
          status: 'confirmed',
          title: 'Standup',
          htmlLink: null,
          allDay: false,
          start: {
            dateTime: '2026-03-30T09:00:00',
            date: null,
            timeZone: 'Asia/Kuala_Lumpur'
          },
          end: {
            dateTime: '2026-03-30T09:30:00',
            date: null,
            timeZone: 'Asia/Kuala_Lumpur'
          }
        }
      ]
    )

    expect(presentation.calendars).toEqual([{ id: 'primary', name: 'Work', color: 'violet' }])
    expect(presentation.events).toEqual([
      {
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
      }
    ])
  })

  test('expands multi-day all-day Google events into one event per day', () => {
    const presentation = buildGoogleCalendarPresentation(
      [
        {
          id: 'team',
          summary: 'Team',
          description: null,
          primary: false,
          backgroundColor: null,
          foregroundColor: null,
          timeZone: null
        }
      ],
      [
        {
          id: 'offsite',
          calendarId: 'team',
          status: 'confirmed',
          title: 'Offsite',
          htmlLink: null,
          allDay: true,
          start: {
            dateTime: null,
            date: '2026-04-02',
            timeZone: null
          },
          end: {
            dateTime: null,
            date: '2026-04-04',
            timeZone: null
          }
        }
      ]
    )

    expect(presentation.events).toEqual([
      {
        id: 'google:team:offsite:0',
        title: 'Offsite',
        date: '2026-04-02',
        allDay: true,
        color: 'green',
        calendar: 'Team',
        source: {
          provider: 'google',
          calendarId: 'team',
          eventId: 'offsite',
          timeZone: null
        }
      },
      {
        id: 'google:team:offsite:1',
        title: 'Offsite',
        date: '2026-04-03',
        allDay: true,
        color: 'green',
        calendar: 'Team',
        source: {
          provider: 'google',
          calendarId: 'team',
          eventId: 'offsite',
          timeZone: null
        }
      }
    ])
  })

  test('drops cancelled and malformed events', () => {
    const presentation = buildGoogleCalendarPresentation(
      [],
      [
        {
          id: 'cancelled',
          calendarId: 'primary',
          status: 'cancelled',
          title: 'Ignore me',
          htmlLink: null,
          allDay: false,
          start: {
            dateTime: '2026-03-30T09:00:00',
            date: null,
            timeZone: null
          },
          end: {
            dateTime: '2026-03-30T09:30:00',
            date: null,
            timeZone: null
          }
        },
        {
          id: 'broken',
          calendarId: 'primary',
          status: 'confirmed',
          title: 'Broken',
          htmlLink: null,
          allDay: false,
          start: {
            dateTime: null,
            date: null,
            timeZone: null
          },
          end: {
            dateTime: null,
            date: null,
            timeZone: null
          }
        }
      ]
    )

    expect(presentation.events).toEqual([])
  })
})

describe('getGoogleCalendarSyncRange', () => {
  test('builds a wide sync window around the visible date', () => {
    expect(getGoogleCalendarSyncRange(new Date(2026, 2, 30))).toEqual({
      timeMin: '2026-02-28T00:00:00.000Z',
      timeMax: '2026-05-30T23:59:59.999Z'
    })
  })
})
