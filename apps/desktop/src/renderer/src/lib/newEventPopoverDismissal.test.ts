import { describe, expect, test } from 'bun:test'
import { shouldDismissNewEventPopover } from './newEventPopoverDismissal'

describe('new event popover dismissal', () => {
  test('does not dismiss while submitting', () => {
    expect(
      shouldDismissNewEventPopover({
        isSubmitting: true,
        insidePanel: false,
        insideOwnedPopover: false
      })
    ).toBe(false)
  })

  test('does not dismiss for clicks inside the main panel', () => {
    expect(
      shouldDismissNewEventPopover({
        isSubmitting: false,
        insidePanel: true,
        insideOwnedPopover: false
      })
    ).toBe(false)
  })

  test('does not dismiss for clicks inside a nested date or time popover', () => {
    expect(
      shouldDismissNewEventPopover({
        isSubmitting: false,
        insidePanel: false,
        insideOwnedPopover: true
      })
    ).toBe(false)
  })

  test('dismisses for true outside clicks', () => {
    expect(
      shouldDismissNewEventPopover({
        isSubmitting: false,
        insidePanel: false,
        insideOwnedPopover: false
      })
    ).toBe(true)
  })
})
