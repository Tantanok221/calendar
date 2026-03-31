import { describe, expect, test } from 'bun:test'
import { buildCalendarHours, formatCalendarHour } from './calendarHours'

describe('buildCalendarHours', () => {
  test('includes the final boundary hour so the grid labels both midnights', () => {
    expect(buildCalendarHours(0, 24)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24
    ])
  })
})

describe('formatCalendarHour', () => {
  test('formats the bottom 24-hour boundary as 12 AM', () => {
    expect(formatCalendarHour(24)).toBe('12 AM')
  })

  test('keeps midday and late evening labels correct', () => {
    expect(formatCalendarHour(12)).toBe('12 PM')
    expect(formatCalendarHour(23)).toBe('11 PM')
  })
})
