import type { CalendarEvent } from '../data/events'
import type { RendererCalendar } from './googleCalendarSync'

export function isRendererCalendarEditable(calendar: RendererCalendar): boolean {
  return calendar.group !== 'other'
}

export function getWritableCalendars(calendars: RendererCalendar[]): RendererCalendar[] {
  return calendars.filter(isRendererCalendarEditable)
}

export function getDefaultWritableCalendarId(
  calendars: RendererCalendar[],
  preferredCalendarId?: string
): string {
  const writableCalendars = getWritableCalendars(calendars)

  if (preferredCalendarId) {
    const preferredCalendar = writableCalendars.find((calendar) => calendar.id === preferredCalendarId)

    if (preferredCalendar) {
      return preferredCalendar.id
    }
  }

  return writableCalendars[0]?.id ?? ''
}

export function isCalendarEventEditable(
  event: CalendarEvent,
  calendars: RendererCalendar[]
): boolean {
  if (!event.source) {
    return true
  }

  const calendar =
    calendars.find((candidate) => candidate.id === event.source?.calendarId) ??
    calendars.find((candidate) => candidate.name === event.calendar)

  return calendar ? isRendererCalendarEditable(calendar) : true
}
