import type { CalendarEvent, EventColor } from '../data/events'
import type { CreateCalendarEventDraft } from './googleCalendarCreate'

export interface EventClipboardKeyboardEventLike {
  key: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  target: EventTarget | null
  defaultPrevented?: boolean
}

export interface EventPasteTarget {
  selectedDate: Date
  allDay: boolean
  startTime: string
  endTime: string
  calendarId: string
  calendarName: string
  color: EventColor
}

export function buildCreateDraftFromCopiedEvent(
  event: CalendarEvent,
  target: EventPasteTarget
): CreateCalendarEventDraft {
  const endTime =
    target.allDay || !event.startTime || !event.endTime
      ? target.endTime
      : addDurationTo12HourTime(target.startTime, getEventDurationMinutes(event))

  return {
    title: event.title,
    location: event.location ?? '',
    selectedDate: new Date(target.selectedDate),
    allDay: target.allDay,
    startTime: target.startTime,
    endTime,
    calendarId: target.calendarId,
    calendarName: target.calendarName,
    color: target.color,
    repeat: false,
    repeatFrequency: 'weekly',
    repeatDays: [],
    repeatEndType: 'date',
    repeatUntil: addMonths(target.selectedDate, 1),
    repeatCount: 4
  }
}

export function isEventCopyShortcut(event: EventClipboardKeyboardEventLike): boolean {
  return matchesEventClipboardShortcut(event, 'c')
}

export function isEventPasteShortcut(
  event: EventClipboardKeyboardEventLike,
  options?: { allowEditableTarget?: boolean }
): boolean {
  return matchesEventClipboardShortcut(event, 'v', options)
}

function matchesEventClipboardShortcut(
  event: EventClipboardKeyboardEventLike,
  key: string,
  options?: { allowEditableTarget?: boolean }
): boolean {
  if (event.defaultPrevented) {
    return false
  }

  if (!options?.allowEditableTarget && isEditableTarget(event.target)) {
    return false
  }

  if (event.altKey || event.shiftKey) {
    return false
  }

  if (event.metaKey === event.ctrlKey) {
    return false
  }

  return event.key.toLowerCase() === key
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') {
    return false
  }

  const editableTarget = target as {
    tagName?: unknown
    isContentEditable?: unknown
  }
  const tagName =
    typeof editableTarget.tagName === 'string' ? editableTarget.tagName.toUpperCase() : ''

  return (
    editableTarget.isContentEditable === true ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  )
}

function addMonths(value: Date, amount: number): Date {
  const next = new Date(value)
  next.setMonth(next.getMonth() + amount)
  return next
}

function getEventDurationMinutes(event: CalendarEvent): number {
  if (!event.startTime || !event.endTime) {
    return 0
  }

  return Math.max(0, to24HourMinutes(event.endTime) - to24HourMinutes(event.startTime))
}

function addDurationTo12HourTime(time: string, durationMinutes: number): string {
  return to12HourTime(to12HourMinutes(time) + durationMinutes)
}

function to24HourMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function to12HourMinutes(time: string): number {
  const [clockTime, meridiem] = time.split(' ')
  const [hoursText, minutesText] = (clockTime ?? '').split(':')
  const hours = Number(hoursText) || 0
  const minutes = Number(minutesText) || 0

  if (meridiem === 'AM') {
    return (hours % 12) * 60 + minutes
  }

  return ((hours % 12) + 12) * 60 + minutes
}

function to12HourTime(totalMinutes: number): string {
  const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(normalizedMinutes / 60)
  const minutes = normalizedMinutes % 60
  const meridiem = hours >= 12 ? 'PM' : 'AM'
  const twelveHour = hours % 12 || 12

  return `${twelveHour}:${String(minutes).padStart(2, '0')} ${meridiem}`
}
