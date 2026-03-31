import { describe, expect, test } from 'bun:test'
import type { CalendarEvent } from '../data/events'
import { buildTimedEventLayout } from './timedEventLayout'

function createTimedEvent(
  id: string,
  startTime: string,
  endTime: string,
  date = '2026-03-31'
): CalendarEvent {
  return {
    id,
    title: id,
    date,
    startTime,
    endTime,
    color: 'blue',
    calendar: 'Work'
  }
}

describe('buildTimedEventLayout', () => {
  test('places overlapping events into separate columns', () => {
    const layout = buildTimedEventLayout([
      createTimedEvent('a', '09:00', '10:00'),
      createTimedEvent('b', '09:30', '10:30')
    ])

    expect(layout).toEqual({
      a: { columnIndex: 0, columnCount: 2 },
      b: { columnIndex: 1, columnCount: 2 }
    })
  })

  test('reuses a freed column when overlap ends', () => {
    const layout = buildTimedEventLayout([
      createTimedEvent('a', '09:00', '10:00'),
      createTimedEvent('b', '09:30', '11:00'),
      createTimedEvent('c', '10:30', '11:30')
    ])

    expect(layout).toEqual({
      a: { columnIndex: 0, columnCount: 2 },
      b: { columnIndex: 1, columnCount: 2 },
      c: { columnIndex: 0, columnCount: 2 }
    })
  })

  test('treats back-to-back events as separate full-width items', () => {
    const layout = buildTimedEventLayout([
      createTimedEvent('a', '09:00', '10:00'),
      createTimedEvent('b', '10:00', '11:00')
    ])

    expect(layout).toEqual({
      a: { columnIndex: 0, columnCount: 1 },
      b: { columnIndex: 0, columnCount: 1 }
    })
  })
})
