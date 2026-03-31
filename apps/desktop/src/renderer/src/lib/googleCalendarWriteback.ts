import type {
  DeleteGoogleCalendarEventInput,
  MoveGoogleCalendarEventInput,
  UpdateGoogleCalendarEventInput
} from '../../../main/googleCalendar/types'
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

  if (!event.allDay && (!event.startTime || !event.endTime)) {
    return null
  }

  return buildGoogleCalendarSavePlan(event, event)?.update ?? null
}

export function buildGoogleCalendarSavePlan(
  previousEvent: CalendarEvent,
  updatedEvent: CalendarEvent
): {
  update: UpdateGoogleCalendarEventInput
  move: MoveGoogleCalendarEventInput | null
} | null {
  if (!isGoogleBackedCalendarEvent(previousEvent) || !isGoogleBackedCalendarEvent(updatedEvent)) {
    return null
  }

  const update = buildUpdatePayload(previousEvent.source, updatedEvent)

  return {
    update,
    move:
      previousEvent.source.calendarId === updatedEvent.source.calendarId
        ? null
        : {
            calendarId: previousEvent.source.calendarId,
            eventId: previousEvent.source.eventId,
            destinationCalendarId: updatedEvent.source.calendarId
          }
  }
}

export function buildGoogleCalendarDeleteFromRendererEvent(
  event: CalendarEvent
): DeleteGoogleCalendarEventInput | null {
  if (!isGoogleBackedCalendarEvent(event)) {
    return null
  }

  return {
    calendarId: event.source.calendarId,
    eventId: event.source.eventId
  }
}

function buildUpdatePayload(
  source: GoogleEventSource,
  event: CalendarEvent
): UpdateGoogleCalendarEventInput {
  if (event.allDay) {
    return {
      calendarId: source.calendarId,
      eventId: source.eventId,
      summary: event.title.trim(),
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
    throw new Error('Timed Google Calendar events require a start and end time')
  }

  return {
    calendarId: source.calendarId,
    eventId: source.eventId,
    summary: event.title.trim(),
    start: {
      dateTime: `${event.date}T${event.startTime}:00.000`,
      date: null,
      timeZone: source.timeZone
    },
    end: {
      dateTime: `${event.date}T${event.endTime}:00.000`,
      date: null,
      timeZone: source.timeZone
    }
  }
}

function nextDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(year, month - 1, day)
  next.setDate(next.getDate() + 1)

  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
}
