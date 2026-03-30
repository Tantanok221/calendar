import type { UpdateGoogleCalendarEventInput } from '../../../main/googleCalendar/types'
import type { CalendarEvent, GoogleEventSource } from '../data/events'

type GoogleBackedCalendarEvent = CalendarEvent & {
  source: GoogleEventSource
}

export function isGoogleBackedCalendarEvent(
  event: CalendarEvent
): event is GoogleBackedCalendarEvent {
  return event.source?.provider === 'google'
}

export function buildGoogleCalendarUpdateFromRendererEvent(
  event: CalendarEvent
): UpdateGoogleCalendarEventInput | null {
  if (!isGoogleBackedCalendarEvent(event)) {
    return null
  }

  if (event.allDay) {
    return {
      calendarId: event.source.calendarId,
      eventId: event.source.eventId,
      start: {
        dateTime: null,
        date: event.date,
        timeZone: null
      },
      end: {
        dateTime: null,
        date: nextDate(event.date),
        timeZone: null
      }
    }
  }

  if (!event.startTime || !event.endTime) {
    return null
  }

  return {
    calendarId: event.source.calendarId,
    eventId: event.source.eventId,
    start: {
      dateTime: `${event.date}T${event.startTime}:00.000`,
      date: null,
      timeZone: event.source.timeZone
    },
    end: {
      dateTime: `${event.date}T${event.endTime}:00.000`,
      date: null,
      timeZone: event.source.timeZone
    }
  }
}

function nextDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(year, month - 1, day)
  next.setDate(next.getDate() + 1)

  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
}
