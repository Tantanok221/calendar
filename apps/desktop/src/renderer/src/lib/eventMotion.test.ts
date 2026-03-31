import { describe, expect, test } from 'bun:test'
import { getAllDayEventPillMotion } from './eventMotion'

describe('getAllDayEventPillMotion', () => {
  test('keeps day-view all-day pills visually stable across date switches', () => {
    expect(getAllDayEventPillMotion({ dragging: false, animateOnMount: false })).toEqual({
      initial: false,
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.15, ease: 'easeOut' }
    })
  })

  test('still reflects drag state even when mount animation is disabled', () => {
    expect(getAllDayEventPillMotion({ dragging: true, animateOnMount: false })).toEqual({
      initial: false,
      animate: { opacity: 0.28, x: 0 },
      transition: { duration: 0.15, ease: 'easeOut' }
    })
  })

  test('preserves enter and exit motion when mount animation is enabled', () => {
    expect(getAllDayEventPillMotion({ dragging: false })).toEqual({
      initial: { opacity: 0, x: -4 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -4 },
      transition: { duration: 0.15, ease: 'easeOut' }
    })
  })
})
