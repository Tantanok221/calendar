import { describe, expect, test } from 'bun:test'
import * as todayLib from './today'

const { addDays, addMonths, getMillisecondsUntilNextDay, getNextMonday, getToday } = todayLib

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

  test('computes a current-time anchored day-view scroll position for today', () => {
    expect(typeof (todayLib as Record<string, unknown>).getDayViewInitialScrollTop).toBe('function')

    const getDayViewInitialScrollTop = (
      todayLib as Record<string, (...args: unknown[]) => unknown>
    ).getDayViewInitialScrollTop

    expect(
      getDayViewInitialScrollTop({
        reference: new Date(2026, 2, 31, 15, 30),
        isToday: true,
        viewportHeight: 800
      })
    ).toBe(712)
    expect(
      getDayViewInitialScrollTop({
        reference: new Date(2026, 2, 31, 6, 30),
        isToday: true,
        viewportHeight: 800
      })
    ).toBe(136)
    expect(
      getDayViewInitialScrollTop({
        reference: new Date(2026, 2, 31, 1, 0),
        isToday: false,
        viewportHeight: 800
      })
    ).toBe(504)
    expect(
      getDayViewInitialScrollTop({
        reference: new Date(2026, 2, 31, 1, 0),
        isToday: true,
        viewportHeight: 800
      })
    ).toBe(0)
  })
})
