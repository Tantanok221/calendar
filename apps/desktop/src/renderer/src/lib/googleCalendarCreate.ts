import type { CreateGoogleCalendarEventInput } from '../../../main/googleCalendar/types'
import type { CalendarEvent, EventColor } from '../data/events'
import { getClosestTimeSuggestion } from './timeSuggestions'
import {
  buildGoogleCalendarRecurrenceRule,
  type GoogleCalendarRepeatDraft
} from './googleCalendarRecurrence'

export type { RepeatEndType } from './googleCalendarRecurrence'

export interface CreateCalendarEventDraft extends GoogleCalendarRepeatDraft {
  title: string
  location: string
  selectedDate: Date
  allDay: boolean
  startTime: string
  endTime: string
  calendarId: string
  calendarName: string
  color: EventColor
}

export function buildGoogleCalendarCreateInput(
  draft: CreateCalendarEventDraft,
  timeZone: string
): CreateGoogleCalendarEventInput {
  const summary = draft.title.trim()
  const location = normalizeOptionalText(draft.location)

  if (!summary) {
    throw new Error('Event title is required')
  }

  if (draft.allDay) {
    return {
      calendarId: draft.calendarId,
      summary,
      ...(location ? { location } : {}),
      start: {
        dateTime: null,
        date: formatDate(draft.selectedDate),
        timeZone: null
      },
      end: {
        dateTime: null,
        date: formatDate(addDays(draft.selectedDate, 1)),
        timeZone: null
      },
      recurrence: buildGoogleCalendarRecurrenceRule(draft)
    }
  }

  const startTime = to24HourTime(draft.startTime)
  const endTime = to24HourTime(draft.endTime)

  if (toMinutes(endTime) <= toMinutes(startTime)) {
    throw new Error('End time must be after the start time')
  }

  return {
    calendarId: draft.calendarId,
    summary,
    ...(location ? { location } : {}),
    start: {
      dateTime: `${formatDate(draft.selectedDate)}T${startTime}:00.000`,
      date: null,
      timeZone
    },
    end: {
      dateTime: `${formatDate(draft.selectedDate)}T${endTime}:00.000`,
      date: null,
      timeZone
    },
    recurrence: buildGoogleCalendarRecurrenceRule(draft)
  }
}

export function buildLocalEventsFromDraft(draft: CreateCalendarEventDraft): CalendarEvent[] {
  const title = draft.title.trim()
  const location = normalizeOptionalText(draft.location)

  if (!title) {
    throw new Error('Event title is required')
  }

  const occurrenceDates = getOccurrenceDates(draft)
  const startTime = draft.allDay ? undefined : to24HourTime(draft.startTime)
  const endTime = draft.allDay ? undefined : to24HourTime(draft.endTime)

  if (!draft.allDay && startTime && endTime && toMinutes(endTime) <= toMinutes(startTime)) {
    throw new Error('End time must be after the start time')
  }

  const idSeed = Date.now()

  return occurrenceDates.map((date, index) => ({
    id: `local:${idSeed}:${index}`,
    title,
    ...(location ? { location } : {}),
    date: formatDate(date),
    startTime,
    endTime,
    allDay: draft.allDay,
    color: draft.color,
    calendar: draft.calendarName
  }))
}

function getOccurrenceDates(draft: CreateCalendarEventDraft): Date[] {
  if (!draft.repeat) {
    return [normalizeDate(draft.selectedDate)]
  }

  const selectedDate = normalizeDate(draft.selectedDate)
  const activeDays = getRepeatDayIndexes(draft)
  const dates: Date[] = []
  const untilDate = draft.repeatEndType === 'date' ? normalizeDate(draft.repeatUntil) : null

  for (
    let cursor = new Date(selectedDate);
    dates.length < Math.max(1, draft.repeatCount) || untilDate !== null;
    cursor = addDays(cursor, 1)
  ) {
    if (untilDate && cursor > untilDate) {
      break
    }

    if (!activeDays.includes(toMondayBasedDay(cursor))) {
      continue
    }

    dates.push(new Date(cursor))

    if (draft.repeatEndType === 'count' && dates.length >= Math.max(1, draft.repeatCount)) {
      break
    }
  }

  return dates
}

function getRepeatDayIndexes(draft: CreateCalendarEventDraft): number[] {
  const selectedDay = toMondayBasedDay(draft.selectedDate)
  const uniqueSortedDays = [...new Set(draft.repeatDays)].sort((left, right) => left - right)

  return uniqueSortedDays.length > 0 ? uniqueSortedDays : [selectedDay]
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

function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function formatDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function normalizeDate(value: Date): Date {
  const normalized = new Date(value)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function addDays(value: Date, amount: number): Date {
  const next = new Date(value)
  next.setDate(next.getDate() + amount)
  return next
}

function toMondayBasedDay(value: Date): number {
  return (value.getDay() + 6) % 7
}
