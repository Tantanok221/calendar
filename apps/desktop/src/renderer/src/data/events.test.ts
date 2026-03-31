import { describe, expect, test } from 'bun:test'
import { END_HOUR, START_HOUR } from './events'

describe('calendar time range', () => {
  test('covers the full 24-hour day in the main calendar grid', () => {
    expect(START_HOUR).toBe(0)
    expect(END_HOUR).toBe(24)
    expect(END_HOUR - START_HOUR).toBe(24)
  })
})
