import type { ViewType } from '../components/TopBar'

export type CalendarKeyboardAction =
  | { type: 'navigate'; direction: 'prev' | 'next' }
  | { type: 'set-view'; view: ViewType }
  | { type: 'go-to-today' }

export interface CalendarKeyboardEventLike {
  key: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  target: EventTarget | null
  defaultPrevented?: boolean
}

export function getNavigatedDate(
  currentDate: Date,
  view: ViewType,
  direction: 'prev' | 'next'
): Date {
  const offset = direction === 'next' ? 1 : -1

  if (view === 'day') {
    return shiftDays(currentDate, offset)
  }

  if (view === 'week') {
    return shiftDays(currentDate, offset * 7)
  }

  return shiftMonths(currentDate, offset)
}

export function getCalendarKeyboardAction(
  event: CalendarKeyboardEventLike
): CalendarKeyboardAction | null {
  if (event.defaultPrevented || hasModifierKey(event) || isEditableTarget(event.target)) {
    return null
  }

  if (event.key === 'ArrowLeft') {
    return { type: 'navigate', direction: 'prev' }
  }

  if (event.key === 'ArrowRight') {
    return { type: 'navigate', direction: 'next' }
  }

  switch (event.key.toLowerCase()) {
    case 'd':
      return { type: 'set-view', view: 'day' }
    case 'w':
      return { type: 'set-view', view: 'week' }
    case 'm':
      return { type: 'set-view', view: 'month' }
    case 't':
      return { type: 'go-to-today' }
    default:
      return null
  }
}

export function getTodayAnchorDate(reference: Date): Date {
  return normalizeDate(reference)
}

function hasModifierKey(event: CalendarKeyboardEventLike): boolean {
  return event.altKey || event.ctrlKey || event.metaKey
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

function normalizeDate(reference: Date): Date {
  const date = new Date(reference)
  date.setHours(0, 0, 0, 0)
  return date
}

function shiftDays(reference: Date, amount: number): Date {
  const date = normalizeDate(reference)
  date.setDate(date.getDate() + amount)
  return date
}

function shiftMonths(reference: Date, amount: number): Date {
  const date = normalizeDate(reference)
  date.setMonth(date.getMonth() + amount)
  return date
}
