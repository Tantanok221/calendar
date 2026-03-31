export type RecurringScopeActionKind = 'edit' | 'delete'
export type RecurringScopeBusyScope = 'instance' | 'series' | null

export function getRecurringScopeActionState(
  kind: RecurringScopeActionKind,
  busyScope: RecurringScopeBusyScope
): {
  isBusy: boolean
  closeDisabled: boolean
  instanceLabel: string
  seriesLabel: string
} {
  const isDelete = kind === 'delete'
  const isBusy = busyScope !== null
  const idleInstanceLabel = isDelete ? 'Delete this event' : 'Edit this event'
  const idleSeriesLabel = isDelete ? 'Delete all events' : 'Edit all events'
  const busyInstanceLabel = isDelete ? 'Deleting this event...' : 'Editing this event...'
  const busySeriesLabel = isDelete ? 'Deleting all events...' : 'Editing all events...'

  return {
    isBusy,
    closeDisabled: isBusy,
    instanceLabel: busyScope === 'instance' ? busyInstanceLabel : idleInstanceLabel,
    seriesLabel: busyScope === 'series' ? busySeriesLabel : idleSeriesLabel
  }
}
