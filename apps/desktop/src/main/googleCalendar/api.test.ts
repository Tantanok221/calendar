import { describe, expect, test } from 'bun:test'
import { createGoogleCalendarEvent, normalizeGoogleCalendarEvent, updateGoogleCalendarEvent } from './api'

describe('normalizeGoogleCalendarEvent', () => {
  test('maps timed events into the app event shape', () => {
    expect(
      normalizeGoogleCalendarEvent('primary', {
        id: 'abc123',
        status: 'confirmed',
        summary: 'Team Standup',
        htmlLink: 'https://calendar.google.com/calendar/event?eid=abc123',
        start: {
          dateTime: '2026-03-30T09:00:00Z',
          timeZone: 'UTC'
        },
        end: {
          dateTime: '2026-03-30T09:30:00Z',
          timeZone: 'UTC'
        }
      })
    ).toEqual({
      id: 'abc123',
      calendarId: 'primary',
      status: 'confirmed',
      title: 'Team Standup',
      htmlLink: 'https://calendar.google.com/calendar/event?eid=abc123',
      allDay: false,
      start: {
        dateTime: '2026-03-30T09:00:00Z',
        date: null,
        timeZone: 'UTC'
      },
      end: {
        dateTime: '2026-03-30T09:30:00Z',
        date: null,
        timeZone: 'UTC'
      }
    })
  })

  test('maps all-day events without manufacturing times', () => {
    expect(
      normalizeGoogleCalendarEvent('work', {
        id: 'all-day-1',
        status: 'confirmed',
        summary: 'Hackathon',
        start: {
          date: '2026-04-02'
        },
        end: {
          date: '2026-04-03'
        }
      })
    ).toEqual({
      id: 'all-day-1',
      calendarId: 'work',
      status: 'confirmed',
      title: 'Hackathon',
      htmlLink: null,
      allDay: true,
      start: {
        dateTime: null,
        date: '2026-04-02',
        timeZone: null
      },
      end: {
        dateTime: null,
        date: '2026-04-03',
        timeZone: null
      }
    })
  })
})

describe('updateGoogleCalendarEvent', () => {
  test('patches Google Calendar events and normalizes the response', async () => {
    let requestedUrl = ''
    let requestedBody = ''

    const updatedEvent = await updateGoogleCalendarEvent({
      accessToken: 'token-123',
      apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
      calendarId: 'primary',
      eventId: 'evt-123',
      start: {
        dateTime: '2026-03-30T02:00:00.000Z',
        date: null,
        timeZone: 'Asia/Kuala_Lumpur'
      },
      end: {
        dateTime: '2026-03-30T02:30:00.000Z',
        date: null,
        timeZone: 'Asia/Kuala_Lumpur'
      },
      fetchImpl: async (input, init) => {
        requestedUrl = String(input)
        requestedBody = String(init?.body ?? '')

        return new Response(
          JSON.stringify({
            id: 'evt-123',
            status: 'confirmed',
            summary: 'Standup',
            start: {
              dateTime: '2026-03-30T02:00:00.000Z',
              timeZone: 'Asia/Kuala_Lumpur'
            },
            end: {
              dateTime: '2026-03-30T02:30:00.000Z',
              timeZone: 'Asia/Kuala_Lumpur'
            }
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
    })

    expect(requestedUrl).toBe(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events/evt-123'
    )
    expect(JSON.parse(requestedBody)).toEqual({
      start: {
        dateTime: '2026-03-30T02:00:00.000Z',
        timeZone: 'Asia/Kuala_Lumpur'
      },
      end: {
        dateTime: '2026-03-30T02:30:00.000Z',
        timeZone: 'Asia/Kuala_Lumpur'
      }
    })
    expect(updatedEvent).toEqual({
      id: 'evt-123',
      calendarId: 'primary',
      status: 'confirmed',
      title: 'Standup',
      htmlLink: null,
      allDay: false,
      start: {
        dateTime: '2026-03-30T02:00:00.000Z',
        date: null,
        timeZone: 'Asia/Kuala_Lumpur'
      },
      end: {
        dateTime: '2026-03-30T02:30:00.000Z',
        date: null,
        timeZone: 'Asia/Kuala_Lumpur'
      }
    })
  })
})

describe('createGoogleCalendarEvent', () => {
  test('inserts Google Calendar events with recurrence', async () => {
    let requestedUrl = ''
    let requestedBody = ''

    const createdEvent = await createGoogleCalendarEvent({
      accessToken: 'token-123',
      apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
      calendarId: 'primary',
      summary: 'Offsite',
      start: {
        dateTime: null,
        date: '2026-03-30',
        timeZone: null
      },
      end: {
        dateTime: null,
        date: '2026-03-31',
        timeZone: null
      },
      recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4'],
      fetchImpl: async (input, init) => {
        requestedUrl = String(input)
        requestedBody = String(init?.body ?? '')

        return new Response(
          JSON.stringify({
            id: 'evt-234',
            status: 'confirmed',
            summary: 'Offsite',
            start: {
              date: '2026-03-30'
            },
            end: {
              date: '2026-03-31'
            }
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
    })

    expect(requestedUrl).toBe('https://www.googleapis.com/calendar/v3/calendars/primary/events')
    expect(JSON.parse(requestedBody)).toEqual({
      summary: 'Offsite',
      start: {
        date: '2026-03-30'
      },
      end: {
        date: '2026-03-31'
      },
      recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4']
    })
    expect(createdEvent).toEqual({
      id: 'evt-234',
      calendarId: 'primary',
      status: 'confirmed',
      title: 'Offsite',
      htmlLink: null,
      allDay: true,
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
