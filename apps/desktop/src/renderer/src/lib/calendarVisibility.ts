import type { CalendarEvent } from '../data/events'

export function filterVisibleCalendarEvents(
  events: CalendarEvent[],
  hiddenCalendars: Set<string>
): CalendarEvent[] {
  return events.filter((event) => !hiddenCalendars.has(event.calendar))
}
