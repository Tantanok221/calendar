import { describe, expect, test } from 'bun:test'
import { buildMonthGrid } from './calendar'

describe('buildMonthGrid', () => {
  test('creates a six-week Monday-first grid for March 2026', () => {
    const days = buildMonthGrid(2026, 2, new Date(2026, 2, 28, 12))

    expect(days).toHaveLength(42)
    expect(days[0]).toMatchObject({
      key: '2026-02-23',
      dayOfMonth: 23,
      currentMonth: false
    })
    expect(days[41]).toMatchObject({
      key: '2026-04-05',
      dayOfMonth: 5,
      currentMonth: false
    })
    expect(days.filter((day) => day.currentMonth)).toHaveLength(31)
  })

  test('marks today inside the visible month grid', () => {
    const days = buildMonthGrid(2026, 2, new Date(2026, 2, 28, 12))
    const today = days.find((day) => day.isToday)

    expect(today).toMatchObject({
      key: '2026-03-28',
      dayOfMonth: 28,
      currentMonth: true,
      isToday: true
    })
  })
})
