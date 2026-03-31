import { describe, expect, test } from 'bun:test'
import {
  buildGoogleCalendarPresentation,
  getGoogleCalendarSyncRange,
  partitionRendererCalendars
} from './googleCalendarSync'
import type { RendererCalendar } from './googleCalendarSync'

describe('buildGoogleCalendarPresentation', () => {
  test('maps timed Google events into renderer events using calendar summaries', () => {
    const presentation = buildGoogleCalendarPresentation(
      [
        {
          id: 'primary',
          summary: 'Work',
          summaryOverride: null,
          description: null,
          primary: true,
          backgroundColor: null,
          foregroundColor: null,
          timeZone: 'Asia/Kuala_Lumpur',
          accessRole: 'owner',
          dataOwner: null,
          selected: true,
          hidden: false
        }
      ],
      [
        {
          id: 'evt-1',
          calendarId: 'primary',
          recurringEventId: 'series-1',
          status: 'confirmed',
          title: 'Standup',
          location: 'Room 301',
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

    expect(presentation.calendars).toEqual([
      { id: 'primary', name: 'Work', color: 'violet', group: 'my' }
    ])
    expect(presentation.events).toEqual([
      {
        id: 'google:primary:evt-1',
        title: 'Standup',
        location: 'Room 301',
        date: '2026-03-30',
        startTime: '09:00',
        endTime: '09:30',
        allDay: false,
        color: 'violet',
        calendar: 'Work',
        source: {
          provider: 'google',
          calendarId: 'primary',
          eventId: 'series-1',
          instanceEventId: 'evt-1',
          recurringEventId: 'series-1',
          timeZone: 'Asia/Kuala_Lumpur'
        }
      }
    ])
  })

  test('inherits recurrence details from the recurring series for expanded instances', () => {
    const presentation = buildGoogleCalendarPresentation(
      [
        {
          id: 'primary',
          summary: 'Work',
          summaryOverride: null,
          description: null,
          primary: true,
          backgroundColor: null,
          foregroundColor: null,
          timeZone: 'Asia/Kuala_Lumpur',
          accessRole: 'owner',
          dataOwner: null,
          selected: true,
          hidden: false
        }
      ],
      [
        {
          id: 'evt-1',
          calendarId: 'primary',
          recurringEventId: 'series-1',
          status: 'confirmed',
          title: 'Standup',
          htmlLink: null,
          allDay: false,
          start: {
            dateTime: '2026-03-31T09:00:00',
            date: null,
            timeZone: 'Asia/Kuala_Lumpur'
          },
          end: {
            dateTime: '2026-03-31T09:30:00',
            date: null,
            timeZone: 'Asia/Kuala_Lumpur'
          }
        },
        {
          id: 'series-1',
          calendarId: 'primary',
          status: 'confirmed',
          title: 'Standup',
          recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO,TU;UNTIL=20260430T235959Z'],
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

    expect(presentation.events).toEqual([
      {
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
          eventId: 'series-1',
          instanceEventId: 'evt-1',
          recurringEventId: 'series-1',
          recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO,TU;UNTIL=20260430T235959Z'],
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
          summaryOverride: null,
          description: null,
          primary: false,
          backgroundColor: null,
          foregroundColor: null,
          timeZone: null,
          accessRole: 'owner',
          dataOwner: null,
          selected: true,
          hidden: false
        }
      ],
      [
        {
          id: 'offsite',
          calendarId: 'team',
          status: 'confirmed',
          title: 'Offsite',
          location: 'Penang',
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
        location: 'Penang',
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
        location: 'Penang',
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

  test('puts editable shared calendars under my calendars and read-only calendars under other calendars', () => {
    const presentation = buildGoogleCalendarPresentation(
      [
        {
          id: 'primary',
          summary: 'Work',
          summaryOverride: null,
          description: null,
          primary: true,
          backgroundColor: null,
          foregroundColor: null,
          timeZone: 'Asia/Kuala_Lumpur',
          accessRole: 'owner',
          dataOwner: null,
          selected: true,
          hidden: false
        },
        {
          id: 'shared-calendar@example.test',
          summary: 'shared-calendar@example.test',
          summaryOverride: 'Kai Tan',
          description: 'Shared calendar',
          primary: false,
          backgroundColor: null,
          foregroundColor: null,
          timeZone: 'Asia/Kuala_Lumpur',
          accessRole: 'writer',
          dataOwner: 'shared-calendar@example.test',
          selected: true,
          hidden: false
        },
        {
          id: 'readonly-calendar@example.test',
          summary: 'readonly-calendar@example.test',
          summaryOverride: 'Read Only',
          description: 'Read-only calendar',
          primary: false,
          backgroundColor: null,
          foregroundColor: null,
          timeZone: 'Asia/Kuala_Lumpur',
          accessRole: 'reader',
          dataOwner: 'readonly-calendar@example.test',
          selected: true,
          hidden: false
        }
      ],
      []
    )

    expect(presentation.calendars).toEqual([
      { id: 'primary', name: 'Work', color: 'violet', group: 'my' },
      { id: 'shared-calendar@example.test', name: 'Kai Tan', color: 'blue', group: 'my' },
      { id: 'readonly-calendar@example.test', name: 'Read Only', color: 'orange', group: 'other' }
    ])
    expect(partitionRendererCalendars(presentation.calendars)).toEqual({
      myCalendars: [
        { id: 'primary', name: 'Work', color: 'violet', group: 'my' },
        { id: 'shared-calendar@example.test', name: 'Kai Tan', color: 'blue', group: 'my' }
      ],
      otherCalendars: [
        {
          id: 'readonly-calendar@example.test',
          name: 'Read Only',
          color: 'orange',
          group: 'other'
        }
      ]
    })
  })

  test('treats legacy calendars without a group as my calendars until they resync', () => {
    const legacyCalendars = [
      { id: 'primary', name: 'Work', color: 'violet' },
      { id: 'team', name: 'Team', color: 'green' }
    ] as unknown as RendererCalendar[]

    expect(partitionRendererCalendars(legacyCalendars)).toEqual({
      myCalendars: legacyCalendars,
      otherCalendars: []
    })
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
