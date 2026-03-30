import { describe, expect, test } from 'bun:test'
import {
  addDays,
  addMonths,
  getMillisecondsUntilNextDay,
  getNextMonday,
  getToday
} from './today'

describe('today helpers', () => {
  test('normalizes the current day to local midnight', () => {
    expect(getToday(new Date(2026, 2, 30, 18, 45, 12, 900))).toEqual(new Date(2026, 2, 30))
  })

  test('builds relative dates from the actual current day', () => {
    const today = getToday(new Date(2026, 2, 30, 9, 15))

    expect(addDays(today, 1)).toEqual(new Date(2026, 2, 31))
    expect(getNextMonday(today)).toEqual(new Date(2026, 3, 6))
    expect(addMonths(today, 1)).toEqual(new Date(2026, 3, 30))
  })

  test('waits only until the next local midnight before rolling today forward', () => {
    expect(getMillisecondsUntilNextDay(new Date(2026, 2, 30, 23, 59, 30))).toBe(30_000)
  })
})
