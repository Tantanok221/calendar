import type {
  GoogleCalendarEvent,
  GoogleCalendarSummary
} from '../../../main/googleCalendar/types'
import { CALENDARS } from '../data/events'
import type { CalendarEvent, EventColor } from '../data/events'

export interface RendererCalendar {
  id: string
  name: string
  color: EventColor
}

interface GoogleCalendarPresentation {
  calendars: RendererCalendar[]
  events: CalendarEvent[]
}

const GOOGLE_EVENT_COLORS: EventColor[] = ['violet', 'green', 'blue', 'orange', 'red']

export function buildGoogleCalendarPresentation(
  calendars: GoogleCalendarSummary[],
  events: GoogleCalendarEvent[]
): GoogleCalendarPresentation {
  const rendererCalendars = calendars.map((calendar, index) => ({
    id: calendar.id,
    name: calendar.summary || 'Google Calendar',
    color: pickGoogleCalendarColor(calendar, index)
  }))
  const calendarById = new Map(rendererCalendars.map((calendar) => [calendar.id, calendar]))

  const rendererEvents = events.flatMap((event) => mapGoogleEventToRendererEvents(event, calendarById))

  return {
    calendars: rendererCalendars,
    events: rendererEvents
  }
}

export function getGoogleCalendarSyncRange(currentDate: Date): {
  timeMin: string
  timeMax: string
} {
  const timeMin = new Date(currentDate)
  timeMin.setDate(timeMin.getDate() - 30)
  timeMin.setHours(0, 0, 0, 0)

  const timeMax = new Date(currentDate)
  timeMax.setDate(timeMax.getDate() + 61)
  timeMax.setHours(23, 59, 59, 999)

  return {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString()
  }
}

function mapGoogleEventToRendererEvents(
  event: GoogleCalendarEvent,
  calendarById: Map<string, RendererCalendar>
): CalendarEvent[] {
  if (event.status === 'cancelled') {
    return []
  }

  const fallbackCalendar = calendarById.get(event.calendarId) ?? {
    id: event.calendarId,
    name: 'Google Calendar',
    color: 'violet' as EventColor
  }

  if (event.allDay && event.start.date && event.end.date) {
    return expandAllDayGoogleEvent(event, fallbackCalendar)
  }

  if (!event.start.dateTime || !event.end.dateTime) {
    return []
  }

  const start = new Date(event.start.dateTime)
  const end = new Date(event.end.dateTime)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return []
  }

  return [
    {
      id: `google:${event.calendarId}:${event.id}`,
      title: event.title || 'Untitled',
      date: formatDate(start),
      startTime: formatTime(start),
      endTime: formatTime(end),
      allDay: false,
      color: fallbackCalendar.color,
      calendar: fallbackCalendar.name,
      source: {
        provider: 'google',
        calendarId: event.calendarId,
        eventId: event.id,
        timeZone: event.start.timeZone ?? event.end.timeZone ?? null
      }
    }
  ]
}

function expandAllDayGoogleEvent(
  event: GoogleCalendarEvent,
  calendar: RendererCalendar
): CalendarEvent[] {
  const start = parseDateOnly(event.start.date!)
  const endExclusive = parseDateOnly(event.end.date!)

  if (!start || !endExclusive || endExclusive <= start) {
    return []
  }

  const expandedEvents: CalendarEvent[] = []

  for (let cursor = new Date(start), index = 0; cursor < endExclusive; index += 1) {
    expandedEvents.push({
      id: `google:${event.calendarId}:${event.id}:${index}`,
      title: event.title || 'Untitled',
      date: formatDate(cursor),
      allDay: true,
      color: calendar.color,
      calendar: calendar.name,
      source: {
        provider: 'google',
        calendarId: event.calendarId,
        eventId: event.id,
        timeZone: event.start.timeZone ?? event.end.timeZone ?? null
      }
    })

    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() + 1)
  }

  return expandedEvents
}

function pickGoogleCalendarColor(calendar: GoogleCalendarSummary, index: number): EventColor {
  if (calendar.primary) {
    return 'violet'
  }

  return GOOGLE_EVENT_COLORS[(index + 1) % GOOGLE_EVENT_COLORS.length] ?? 'violet'
}

function parseDateOnly(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export const DEFAULT_RENDERER_CALENDARS: RendererCalendar[] = CALENDARS.map((calendar, index) => ({
  id: `default:${index}`,
  name: calendar.name,
  color: calendar.color
}))
