import { describe, expect, test } from 'bun:test'
import {
  buildGoogleCalendarDeleteFromRendererEvent,
  buildGoogleCalendarSavePlan,
  buildGoogleCalendarUpdateFromRendererEvent,
  isRecurringGoogleCalendarEvent,
  isGoogleBackedCalendarEvent
} from './googleCalendarWriteback'

describe('isGoogleBackedCalendarEvent', () => {
  test('detects Google-backed renderer events', () => {
    expect(
      isGoogleBackedCalendarEvent({
        id: 'google:primary:evt-1',
        title: 'Standup',
        location: 'War room',
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
        location: 'War room',
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
      summary: 'Standup',
      location: 'War room',
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
        location: 'HQ',
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
      summary: 'Offsite',
      location: 'HQ',
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

  test('builds a save plan that patches first and moves calendars when needed', () => {
    expect(
      buildGoogleCalendarSavePlan(
        {
          id: 'google:primary:evt-1',
          title: 'Standup',
          location: 'Room A',
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
            timeZone: 'Asia/Kuala_Lumpur',
            recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4'],
            recurrenceDirty: true
          }
        },
        {
          id: 'google:primary:evt-1',
          title: 'Standup moved',
          location: 'Room B',
          date: '2026-03-31',
          startTime: '10:00',
          endTime: '10:30',
          allDay: false,
          color: 'green',
          calendar: 'Team',
          source: {
            provider: 'google',
            calendarId: 'team',
            eventId: 'evt-1',
            timeZone: 'Asia/Kuala_Lumpur',
            recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=TU,WE;COUNT=6'],
            recurrenceDirty: true
          }
        }
      )
    ).toEqual({
      update: {
        calendarId: 'primary',
        eventId: 'evt-1',
        summary: 'Standup moved',
        location: 'Room B',
        start: {
          dateTime: '2026-03-31T10:00:00.000',
          date: null,
          timeZone: 'Asia/Kuala_Lumpur'
        },
        end: {
          dateTime: '2026-03-31T10:30:00.000',
          date: null,
          timeZone: 'Asia/Kuala_Lumpur'
        },
        recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=TU,WE;COUNT=6']
      },
      move: {
        calendarId: 'primary',
        eventId: 'evt-1',
        destinationCalendarId: 'team'
      }
    })
  })

  test('clears recurrence when a recurring Google event is changed to one-off', () => {
    expect(
      buildGoogleCalendarSavePlan(
        {
          id: 'google:primary:series-1',
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
            eventId: 'series-1',
            recurringEventId: 'series-1',
            timeZone: 'Asia/Kuala_Lumpur'
          }
        },
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
            eventId: 'series-1',
            recurringEventId: 'series-1',
            timeZone: 'Asia/Kuala_Lumpur',
            recurrence: [],
            recurrenceDirty: true
          }
        }
      )
    ).toEqual({
      update: {
        calendarId: 'primary',
        eventId: 'series-1',
        summary: 'Standup',
        location: null,
        start: {
          dateTime: '2026-03-30T09:00:00.000',
          date: null,
          timeZone: 'Asia/Kuala_Lumpur'
        },
        end: {
          dateTime: '2026-03-30T09:30:00.000',
          date: null,
          timeZone: 'Asia/Kuala_Lumpur'
        },
        recurrence: []
      },
      move: null
    })
  })

  test('builds an instance-scoped save plan for recurring events', () => {
    expect(
      buildGoogleCalendarSavePlan(
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
            recurringEventId: 'series-1',
            instanceEventId: 'evt-1',
            timeZone: 'Asia/Kuala_Lumpur'
          }
        },
        {
          id: 'google:primary:evt-1',
          title: 'Standup moved',
          date: '2026-03-31',
          startTime: '10:00',
          endTime: '10:30',
          allDay: false,
          color: 'violet',
          calendar: 'Work',
          source: {
            provider: 'google',
            calendarId: 'primary',
            eventId: 'series-1',
            recurringEventId: 'series-1',
            instanceEventId: 'evt-1',
            timeZone: 'Asia/Kuala_Lumpur'
          }
        },
        'instance'
      )
    ).toEqual({
      update: {
        calendarId: 'primary',
        eventId: 'evt-1',
        summary: 'Standup moved',
        location: null,
        start: {
          dateTime: '2026-03-31T10:00:00.000',
          date: null,
          timeZone: 'Asia/Kuala_Lumpur'
        },
        end: {
          dateTime: '2026-03-31T10:30:00.000',
          date: null,
          timeZone: 'Asia/Kuala_Lumpur'
        }
      },
      move: null
    })
  })
})

describe('buildGoogleCalendarDeleteFromRendererEvent', () => {
  test('builds the delete payload for Google-backed events', () => {
    expect(
      buildGoogleCalendarDeleteFromRendererEvent({
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
    ).toEqual({
      calendarId: 'primary',
      eventId: 'evt-1'
    })
  })

  test('detects recurring Google-backed events', () => {
    expect(
      isRecurringGoogleCalendarEvent({
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
          eventId: 'series-1',
          recurringEventId: 'series-1',
          instanceEventId: 'evt-1',
          timeZone: 'Asia/Kuala_Lumpur'
        }
      })
    ).toBe(true)
  })

  test('builds an instance delete payload for recurring events', () => {
    expect(
      buildGoogleCalendarDeleteFromRendererEvent(
        {
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
            eventId: 'series-1',
            recurringEventId: 'series-1',
            instanceEventId: 'evt-1',
            timeZone: 'Asia/Kuala_Lumpur'
          }
        },
        'instance'
      )
    ).toEqual({
      calendarId: 'primary',
      eventId: 'evt-1'
    })
  })

  test('builds a series delete payload for recurring events', () => {
    expect(
      buildGoogleCalendarDeleteFromRendererEvent(
        {
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
            eventId: 'series-1',
            recurringEventId: 'series-1',
            instanceEventId: 'evt-1',
            timeZone: 'Asia/Kuala_Lumpur'
          }
        },
        'series'
      )
    ).toEqual({
      calendarId: 'primary',
      eventId: 'series-1'
    })
  })
})
