import { describe, expect, test } from 'bun:test'
import { getVisibleTimedPreviewRange } from './newEventPreviewStyle'

describe('new event preview helpers', () => {
  test('hides the timed preview when the all-day preview is visible', () => {
    expect(
      getVisibleTimedPreviewRange({
        allDayPreviewVisible: true,
        pinnedPreview: {
          startMinutes: 9 * 60,
          endMinutes: 10 * 60
        },
        timedSelectionPreview: {
          startMinutes: 11 * 60,
          endMinutes: 12 * 60
        }
      })
    ).toBeNull()
  })

  test('prefers the pinned timed preview when all-day preview is not visible', () => {
    expect(
      getVisibleTimedPreviewRange({
        allDayPreviewVisible: false,
        pinnedPreview: {
          startMinutes: 9 * 60,
          endMinutes: 10 * 60
        },
        timedSelectionPreview: {
          startMinutes: 11 * 60,
          endMinutes: 12 * 60
        }
      })
    ).toEqual({
      startMinutes: 9 * 60,
      endMinutes: 10 * 60
    })
  })
})
