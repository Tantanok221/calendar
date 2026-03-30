import { END_HOUR, START_HOUR, timeToMinutes, toDateStr } from '../data/events'
import type { CalendarEvent } from '../data/events'

export const SNAP_MINUTES = 30
export type CalendarDropView = 'day' | 'week'
export type CalendarDropLane = 'timed' | 'all-day'

function roundToSnap(minutes: number, snapMinutes: number = SNAP_MINUTES): number {
  return Math.round(minutes / snapMinutes) * snapMinutes
}

function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, totalMinutes)
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function buildDropSlotId(view: CalendarDropView, date: Date, startMinutes: number): string {
  return `${view}:timed:${toDateStr(date)}:${startMinutes}`
}

export function buildAllDayDropSlotId(view: CalendarDropView, date: Date): string {
  return `${view}:all-day:${toDateStr(date)}`
}

export function parseDropSlotId(slotId: string): {
  view: CalendarDropView
  date: string
  startMinutes: number | null
  lane: CalendarDropLane
} {
  const [view, lane, date, startMinutes] = slotId.split(':')

  if ((view !== 'day' && view !== 'week') || (lane !== 'timed' && lane !== 'all-day') || !date) {
    throw new Error(`Invalid drop slot id: ${slotId}`)
  }

  if (lane === 'timed') {
    if (!startMinutes) {
      throw new Error(`Invalid timed drop slot id: ${slotId}`)
    }

    return {
      view,
      date,
      startMinutes: Number(startMinutes),
      lane
    }
  }

  return {
    view,
    date,
    startMinutes: null,
    lane
  }
}

export function clampEventStartMinutes(
  startMinutes: number,
  durationMinutes: number,
  dayStartMinutes: number = START_HOUR * 60,
  dayEndMinutes: number = END_HOUR * 60
): number {
  const latestStart = Math.max(dayStartMinutes, dayEndMinutes - durationMinutes)

  return Math.min(Math.max(startMinutes, dayStartMinutes), latestStart)
}

export function getDateFromColumnIndex(weekStart: Date, columnIndex: number): Date {
  const date = new Date(weekStart)
  date.setDate(weekStart.getDate() + columnIndex)
  date.setHours(0, 0, 0, 0)

  return date
}

interface RescheduleTimedEventInput {
  date: Date
  startMinutes: number
  dayStartMinutes?: number
  dayEndMinutes?: number
}

export function rescheduleTimedEvent(
  event: CalendarEvent,
  {
    date,
    startMinutes,
    dayStartMinutes = START_HOUR * 60,
    dayEndMinutes = END_HOUR * 60
  }: RescheduleTimedEventInput
): CalendarEvent {
  if (event.allDay || !event.startTime || !event.endTime) return event

  const durationMinutes = timeToMinutes(event.endTime) - timeToMinutes(event.startTime)
  const nextStartMinutes = clampEventStartMinutes(
    roundToSnap(startMinutes),
    durationMinutes,
    dayStartMinutes,
    dayEndMinutes
  )
  const nextEndMinutes = nextStartMinutes + durationMinutes

  return {
    ...event,
    date: toDateStr(date),
    startTime: minutesToTime(nextStartMinutes),
    endTime: minutesToTime(nextEndMinutes)
  }
}

export function rescheduleAllDayEvent(event: CalendarEvent, date: Date): CalendarEvent {
  return {
    ...event,
    date: toDateStr(date),
    allDay: true,
    startTime: undefined,
    endTime: undefined
  }
}
