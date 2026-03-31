import { describe, expect, test } from 'bun:test'
import type { CalendarEvent } from '../data/events'
import { getEventPrimaryLabel, getEventSecondaryLabel } from './eventLocationDisplay'

const BASE_EVENT: CalendarEvent = {
  id: 'evt-1',
  title: 'Design Review',
  date: '2026-03-31',
  startTime: '10:00',
  endTime: '11:00',
  color: 'violet',
  calendar: 'Work'
}

describe('getEventPrimaryLabel', () => {
  test('appends the location to compact event labels when present', () => {
    expect(
      getEventPrimaryLabel({
        ...BASE_EVENT,
        location: 'Room 12'
      })
    ).toBe('Design Review • Room 12')
  })

  test('returns the title alone when the event has no location', () => {
    expect(getEventPrimaryLabel(BASE_EVENT)).toBe('Design Review')
  })
})

describe('getEventSecondaryLabel', () => {
  test('prefers the location over the calendar name', () => {
    expect(
      getEventSecondaryLabel({
        ...BASE_EVENT,
        location: 'Room 12'
      })
    ).toBe('Room 12')
  })

  test('falls back to the calendar name when there is no location', () => {
    expect(getEventSecondaryLabel(BASE_EVENT)).toBe('Work')
  })

  test('returns null when neither location nor calendar is available', () => {
    expect(
      getEventSecondaryLabel({
        ...BASE_EVENT,
        calendar: ''
      })
    ).toBeNull()
  })
})
