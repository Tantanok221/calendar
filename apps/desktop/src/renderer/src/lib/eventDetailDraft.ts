import type { CalendarEvent } from '../data/events'
import type { RendererCalendar } from './googleCalendarSync'
import { getClosestTimeSuggestion } from './timeSuggestions'
import { buildGoogleCalendarUpdateRecurrence, type RepeatEndType } from './googleCalendarRecurrence'

export interface EventDetailDraft {
  title: string
  location: string
  selectedDate: Date
  allDay: boolean
  startTime: string
  endTime: string
  calendarId: string
  calendarName: string
  color: RendererCalendar['color']
  repeatChanged: boolean
  repeat: boolean
  repeatDays: number[]
  repeatEndType: RepeatEndType
  repeatUntil: Date
  repeatCount: number
}

export function buildUpdatedEventFromDetailDraft(
  event: CalendarEvent,
  draft: EventDetailDraft
): CalendarEvent {
  const title = draft.title.trim()
  const location = normalizeOptionalText(draft.location)

  if (!title) {
    throw new Error('Event title is required')
  }

  const nextEvent: CalendarEvent = {
    ...event,
    title,
    location,
    date: formatDate(draft.selectedDate),
    allDay: draft.allDay,
    color: draft.color,
    calendar: draft.calendarName
  }

  if (event.source) {
    nextEvent.source = {
      ...event.source,
      calendarId: draft.calendarId
    }

    if (draft.repeatChanged) {
      nextEvent.source.recurrenceDirty = true
      nextEvent.source.recurrence = buildGoogleCalendarUpdateRecurrence(draft)
    }
  }

  if (draft.allDay) {
    nextEvent.startTime = undefined
    nextEvent.endTime = undefined
    return nextEvent
  }

  const startTime = to24HourTime(draft.startTime)
  const endTime = to24HourTime(draft.endTime)

  if (toMinutes(endTime) <= toMinutes(startTime)) {
    throw new Error('End time must be after the start time')
  }

  nextEvent.startTime = startTime
  nextEvent.endTime = endTime

  return nextEvent
}

function to24HourTime(value: string): string {
  const suggestion = getClosestTimeSuggestion(value)

  if (!suggestion) {
    throw new Error('Enter a valid start and end time')
  }

  const [time, meridiem] = suggestion.split(' ')
  const [rawHour, rawMinute] = time.split(':').map(Number)
  const hours =
    meridiem === 'AM' ? rawHour % 12 : rawHour % 12 === rawHour ? (rawHour % 12) + 12 : rawHour

  return `${String(hours).padStart(2, '0')}:${String(rawMinute).padStart(2, '0')}`
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function formatDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}
