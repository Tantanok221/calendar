import { describe, expect, test } from 'bun:test'
import {
  formatGoogleCalendarRecurrenceSummary,
  parseGoogleCalendarRecurrence
} from './googleCalendarRecurrence'

describe('parseGoogleCalendarRecurrence', () => {
  test('parses monthly day-of-month recurrence rules', () => {
    expect(
      parseGoogleCalendarRecurrence(['RRULE:FREQ=MONTHLY;BYMONTHDAY=30;COUNT=4'])
    ).toMatchObject({
      repeat: true,
      repeatFrequency: 'monthly',
      repeatEndType: 'count',
      repeatCount: 4
    })
  })
})

describe('formatGoogleCalendarRecurrenceSummary', () => {
  test('formats monthly recurrence summaries', () => {
    expect(
      formatGoogleCalendarRecurrenceSummary(['RRULE:FREQ=MONTHLY;BYMONTHDAY=30;COUNT=4'])
    ).toBe('Repeats monthly on the 30th · 4 times')
  })
})
