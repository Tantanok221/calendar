import type { CalendarEvent } from '../data/events'

export function getEventPrimaryLabel(event: CalendarEvent): string {
  return event.location ? `${event.title} • ${event.location}` : event.title
}

export function getEventSecondaryLabel(event: CalendarEvent): string | null {
  const location = normalizeOptionalText(event.location)

  if (location) {
    return location
  }

  return normalizeOptionalText(event.calendar) ?? null
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
