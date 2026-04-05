import { END_HOUR, HOUR_HEIGHT, START_HOUR, timeToMinutes, toDateStr } from '../data/events'
import type { CalendarEvent } from '../data/events'

export const SNAP_MINUTES = 30
export type CalendarDropView = 'day' | 'week'
export type CalendarDropLane = 'timed' | 'all-day'
export type TimedEventResizeEdge = 'start' | 'end'
export interface TimedSelectionRange {
  startMinutes: number
  endMinutes: number
}

export interface NewEventDraftDefaults {
  selectedDate: Date
  allDay: boolean
  startTime: string
  endTime: string
}

function roundToSnap(minutes: number, snapMinutes: number = SNAP_MINUTES): number {
  return Math.round(minutes / snapMinutes) * snapMinutes
}

function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, totalMinutes)
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function minutesToDraftTime(totalMinutes: number): string {
  const normalized = Math.max(0, totalMinutes)
  const hours24 = Math.floor(normalized / 60)
  const minutes = normalized % 60
  const meridiem = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12

  return `${hours12}:${String(minutes).padStart(2, '0')} ${meridiem}`
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

export function getTimedSlotStartMinutes(
  offsetPx: number,
  hourHeight: number = HOUR_HEIGHT,
  dayStartMinutes: number = START_HOUR * 60,
  dayEndMinutes: number = END_HOUR * 60,
  snapMinutes: number = SNAP_MINUTES
): number {
  const rawMinutes = dayStartMinutes + Math.floor((Math.max(0, offsetPx) / hourHeight) * 60)
  const snappedMinutes = Math.floor(rawMinutes / snapMinutes) * snapMinutes

  return clampEventStartMinutes(snappedMinutes, snapMinutes, dayStartMinutes, dayEndMinutes)
}

export function getTimedResizeBoundaryMinutes(
  offsetPx: number,
  hourHeight: number = HOUR_HEIGHT,
  dayStartMinutes: number = START_HOUR * 60,
  dayEndMinutes: number = END_HOUR * 60,
  snapMinutes: number = SNAP_MINUTES
): number {
  const rawMinutes = dayStartMinutes + (Math.max(0, offsetPx) / hourHeight) * 60
  const snappedMinutes = roundToSnap(rawMinutes, snapMinutes)

  return Math.min(Math.max(snappedMinutes, dayStartMinutes), dayEndMinutes)
}

export function getTimedSelectionRange(
  anchorStartMinutes: number,
  currentStartMinutes: number,
  dayStartMinutes: number = START_HOUR * 60,
  dayEndMinutes: number = END_HOUR * 60,
  snapMinutes: number = SNAP_MINUTES
): TimedSelectionRange {
  const anchor = clampEventStartMinutes(
    roundToSnap(anchorStartMinutes),
    snapMinutes,
    dayStartMinutes,
    dayEndMinutes
  )
  const current = clampEventStartMinutes(
    roundToSnap(currentStartMinutes),
    snapMinutes,
    dayStartMinutes,
    dayEndMinutes
  )

  return {
    startMinutes: Math.max(dayStartMinutes, Math.min(anchor, current)),
    endMinutes: Math.min(dayEndMinutes, Math.max(anchor, current) + snapMinutes)
  }
}

export function getTimedDragPreviewRange(
  startMinutes: number,
  durationMinutes: number,
  dayStartMinutes: number = START_HOUR * 60,
  dayEndMinutes: number = END_HOUR * 60
): TimedSelectionRange {
  const clampedStartMinutes = clampEventStartMinutes(
    roundToSnap(startMinutes),
    durationMinutes,
    dayStartMinutes,
    dayEndMinutes
  )

  return {
    startMinutes: clampedStartMinutes,
    endMinutes: clampedStartMinutes + durationMinutes
  }
}

export function buildTimedDraftFromSelection(
  date: Date,
  range: TimedSelectionRange,
  dayEndMinutes: number = END_HOUR * 60,
  snapMinutes: number = SNAP_MINUTES
): NewEventDraftDefaults {
  const startMinutes = range.startMinutes
  const endMinutes = Math.min(dayEndMinutes, Math.max(startMinutes + snapMinutes, range.endMinutes))

  return {
    selectedDate: new Date(date),
    allDay: false,
    startTime: minutesToDraftTime(startMinutes),
    endTime: minutesToDraftTime(endMinutes)
  }
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

interface ResizeTimedEventInput {
  edge: TimedEventResizeEdge
  boundaryMinutes: number
  dayStartMinutes?: number
  dayEndMinutes?: number
  minDurationMinutes?: number
}

interface ResizeTimedSelectionRangeInput {
  edge: TimedEventResizeEdge
  boundaryMinutes: number
  dayStartMinutes?: number
  dayEndMinutes?: number
  minDurationMinutes?: number
}

export function resizeTimedEvent(
  event: CalendarEvent,
  {
    edge,
    boundaryMinutes,
    dayStartMinutes = START_HOUR * 60,
    dayEndMinutes = END_HOUR * 60,
    minDurationMinutes = SNAP_MINUTES
  }: ResizeTimedEventInput
): CalendarEvent {
  if (event.allDay || !event.startTime || !event.endTime) return event

  const currentStartMinutes = timeToMinutes(event.startTime)
  const currentEndMinutes = timeToMinutes(event.endTime)
  const snappedBoundaryMinutes = Math.min(
    Math.max(roundToSnap(boundaryMinutes, minDurationMinutes), dayStartMinutes),
    dayEndMinutes
  )

  const nextStartMinutes =
    edge === 'start'
      ? Math.min(snappedBoundaryMinutes, currentEndMinutes - minDurationMinutes)
      : currentStartMinutes
  const nextEndMinutes =
    edge === 'end'
      ? Math.max(snappedBoundaryMinutes, currentStartMinutes + minDurationMinutes)
      : currentEndMinutes

  return {
    ...event,
    startTime: minutesToTime(nextStartMinutes),
    endTime: minutesToTime(nextEndMinutes)
  }
}

export function resizeTimedSelectionRange(
  range: TimedSelectionRange,
  {
    edge,
    boundaryMinutes,
    dayStartMinutes = START_HOUR * 60,
    dayEndMinutes = END_HOUR * 60,
    minDurationMinutes = SNAP_MINUTES
  }: ResizeTimedSelectionRangeInput
): TimedSelectionRange {
  const snappedBoundaryMinutes = Math.min(
    Math.max(roundToSnap(boundaryMinutes, minDurationMinutes), dayStartMinutes),
    dayEndMinutes
  )

  return {
    startMinutes:
      edge === 'start'
        ? Math.min(snappedBoundaryMinutes, range.endMinutes - minDurationMinutes)
        : range.startMinutes,
    endMinutes:
      edge === 'end'
        ? Math.max(snappedBoundaryMinutes, range.startMinutes + minDurationMinutes)
        : range.endMinutes
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
