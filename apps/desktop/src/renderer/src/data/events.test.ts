import { describe, expect, test } from 'bun:test'
import { fromDateStr, toDateStr } from './events'

describe('event date helpers', () => {
  test('fromDateStr round-trips with toDateStr', () => {
    expect(toDateStr(fromDateStr('2026-04-07'))).toBe('2026-04-07')
  })
})
