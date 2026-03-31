import { describe, expect, test } from 'bun:test'
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  fetchGoogleCalendars,
  moveGoogleCalendarEvent,
  normalizeGoogleCalendarEvent,
  updateGoogleCalendarEvent
} from './api'

describe('fetchGoogleCalendars', () => {
  test('preserves calendar metadata used to classify shared calendars', async () => {
    const calendars = await fetchGoogleCalendars({
      accessToken: 'token-123',
      apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            items: [
              {
                id: 'shared-calendar@example.test',
                summary: 'shared-calendar@example.test',
                summaryOverride: 'Kai Tan',
                description: 'Shared calendar',
                primary: false,
                backgroundColor: '#000000',
                foregroundColor: '#ffffff',
                timeZone: 'Asia/Kuala_Lumpur',
                accessRole: 'writer',
                dataOwner: 'shared-calendar@example.test',
                selected: true,
                hidden: false
              }
            ]
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
    })

    expect(calendars).toEqual([
      {
        id: 'shared-calendar@example.test',
        summary: 'shared-calendar@example.test',
        summaryOverride: 'Kai Tan',
        description: 'Shared calendar',
        primary: false,
        backgroundColor: '#000000',
        foregroundColor: '#ffffff',
        timeZone: 'Asia/Kuala_Lumpur',
        accessRole: 'writer',
        dataOwner: 'shared-calendar@example.test',
        selected: true,
        hidden: false
      }
    ])
  })
})

describe('normalizeGoogleCalendarEvent', () => {
  test('maps timed events into the app event shape', () => {
    expect(
      normalizeGoogleCalendarEvent('primary', {
        id: 'abc123',
        recurringEventId: 'series-1',
        status: 'confirmed',
        summary: 'Team Standup',
        location: 'Room 5',
        htmlLink: 'https://calendar.google.com/calendar/event?eid=abc123',
        recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4'],
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
      recurringEventId: 'series-1',
      status: 'confirmed',
      title: 'Team Standup',
      location: 'Room 5',
      htmlLink: 'https://calendar.google.com/calendar/event?eid=abc123',
      recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4'],
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
      summary: 'Standup',
      location: 'Boardroom',
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
      recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4'],
      fetchImpl: async (input, init) => {
        requestedUrl = String(input)
        requestedBody = String(init?.body ?? '')

        return new Response(
          JSON.stringify({
            id: 'evt-123',
            recurringEventId: 'series-123',
            status: 'confirmed',
            summary: 'Standup',
            location: 'Boardroom',
            recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4'],
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
      summary: 'Standup',
      location: 'Boardroom',
      start: {
        dateTime: '2026-03-30T02:00:00.000Z',
        timeZone: 'Asia/Kuala_Lumpur'
      },
      end: {
        dateTime: '2026-03-30T02:30:00.000Z',
        timeZone: 'Asia/Kuala_Lumpur'
      },
      recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4']
    })
    expect(updatedEvent).toEqual({
      id: 'evt-123',
      calendarId: 'primary',
      recurringEventId: 'series-123',
      status: 'confirmed',
      title: 'Standup',
      location: 'Boardroom',
      htmlLink: null,
      recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4'],
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

describe('moveGoogleCalendarEvent', () => {
  test('moves an event into another calendar and normalizes the response', async () => {
    let requestedUrl = ''
    let requestedMethod = ''

    const movedEvent = await moveGoogleCalendarEvent({
      accessToken: 'token-123',
      apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
      calendarId: 'primary',
      eventId: 'evt-123',
      destinationCalendarId: 'team',
      fetchImpl: async (input, init) => {
        requestedUrl = String(input)
        requestedMethod = String(init?.method ?? '')

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

    expect(requestedMethod).toBe('POST')
    expect(requestedUrl).toBe(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events/evt-123/move?destination=team'
    )
    expect(movedEvent).toEqual({
      id: 'evt-123',
      calendarId: 'team',
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

describe('deleteGoogleCalendarEvent', () => {
  test('deletes an event', async () => {
    let requestedUrl = ''
    let requestedMethod = ''

    await deleteGoogleCalendarEvent({
      accessToken: 'token-123',
      apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
      calendarId: 'primary',
      eventId: 'evt-123',
      fetchImpl: async (input, init) => {
        requestedUrl = String(input)
        requestedMethod = String(init?.method ?? '')

        return new Response(null, { status: 204 })
      }
    })

    expect(requestedMethod).toBe('DELETE')
    expect(requestedUrl).toBe(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events/evt-123'
    )
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
      location: 'Offsite Lodge',
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
            location: 'Offsite Lodge',
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
      location: 'Offsite Lodge',
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
      location: 'Offsite Lodge',
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
