import type {
  DeleteGoogleCalendarEventInput,
  MoveGoogleCalendarEventInput,
  UpdateGoogleCalendarEventInput
} from '../../../main/googleCalendar/types'
import type { CalendarEvent, GoogleEventSource } from '../data/events'

export type GoogleCalendarDeleteScope = 'instance' | 'series'
export type GoogleCalendarSaveScope = 'instance' | 'series'

type GoogleBackedCalendarEvent = CalendarEvent & {
  source: GoogleEventSource
}

export function isGoogleBackedCalendarEvent(
  event: CalendarEvent
): event is GoogleBackedCalendarEvent {
  return event.source?.provider === 'google'
}

export function isRecurringGoogleCalendarEvent(
  event: CalendarEvent
): event is GoogleBackedCalendarEvent {
  return isGoogleBackedCalendarEvent(event) && Boolean(event.source.recurringEventId)
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
  updatedEvent: CalendarEvent,
  scope: GoogleCalendarSaveScope = 'series'
): {
  update: UpdateGoogleCalendarEventInput
  move: MoveGoogleCalendarEventInput | null
} | null {
  if (!isGoogleBackedCalendarEvent(previousEvent) || !isGoogleBackedCalendarEvent(updatedEvent)) {
    return null
  }

  const update = buildUpdatePayload(previousEvent.source, updatedEvent, scope)
  const targetEventId =
    scope === 'instance' && previousEvent.source.instanceEventId
      ? previousEvent.source.instanceEventId
      : previousEvent.source.eventId

  return {
    update,
    move:
      previousEvent.source.calendarId === updatedEvent.source.calendarId
        ? null
        : {
            calendarId: previousEvent.source.calendarId,
            eventId: targetEventId,
            destinationCalendarId: updatedEvent.source.calendarId
          }
  }
}

export function buildGoogleCalendarDeleteFromRendererEvent(
  event: CalendarEvent,
  scope: GoogleCalendarDeleteScope = 'series'
): DeleteGoogleCalendarEventInput | null {
  if (!isGoogleBackedCalendarEvent(event)) {
    return null
  }

  if (scope === 'instance' && event.source.instanceEventId) {
    return {
      calendarId: event.source.calendarId,
      eventId: event.source.instanceEventId
    }
  }

  return {
    calendarId: event.source.calendarId,
    eventId: event.source.eventId
  }
}

function buildUpdatePayload(
  previousSource: GoogleEventSource,
  event: CalendarEvent,
  scope: GoogleCalendarSaveScope
): UpdateGoogleCalendarEventInput {
  const eventSource = event.source?.provider === 'google' ? event.source : previousSource
  const recurrence =
    eventSource.recurrenceDirty === true ? { recurrence: eventSource.recurrence ?? [] } : {}
  const targetEventId =
    scope === 'instance' && previousSource.instanceEventId
      ? previousSource.instanceEventId
      : previousSource.eventId

  if (event.allDay) {
    return {
      calendarId: previousSource.calendarId,
      eventId: targetEventId,
      summary: event.title.trim(),
      location: normalizeLocation(event.location),
      ...recurrence,
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
    calendarId: previousSource.calendarId,
    eventId: targetEventId,
    summary: event.title.trim(),
    location: normalizeLocation(event.location),
    ...recurrence,
    start: {
      dateTime: `${event.date}T${event.startTime}:00.000`,
      date: null,
      timeZone: previousSource.timeZone
    },
    end: {
      dateTime: `${event.date}T${event.endTime}:00.000`,
      date: null,
      timeZone: previousSource.timeZone
    }
  }
}

function nextDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(year, month - 1, day)
  next.setDate(next.getDate() + 1)

  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
}

function normalizeLocation(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
