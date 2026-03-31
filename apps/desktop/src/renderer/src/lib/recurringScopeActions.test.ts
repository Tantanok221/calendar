import { describe, expect, test } from 'bun:test'
import { getRecurringScopeActionState } from './recurringScopeActions'

describe('getRecurringScopeActionState', () => {
  test('builds idle labels for delete actions', () => {
    expect(getRecurringScopeActionState('delete', null)).toEqual({
      isBusy: false,
      closeDisabled: false,
      instanceLabel: 'Delete this event',
      seriesLabel: 'Delete all events'
    })
  })

  test('builds busy labels for instance-scoped edit actions', () => {
    expect(getRecurringScopeActionState('edit', 'instance')).toEqual({
      isBusy: true,
      closeDisabled: true,
      instanceLabel: 'Editing this event...',
      seriesLabel: 'Edit all events'
    })
  })

  test('builds busy labels for series-scoped delete actions', () => {
    expect(getRecurringScopeActionState('delete', 'series')).toEqual({
      isBusy: true,
      closeDisabled: true,
      instanceLabel: 'Delete this event',
      seriesLabel: 'Deleting all events...'
    })
  })
})
