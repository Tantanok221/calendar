import type { RecurringScopeBusyScope } from '../lib/recurringScopeActions'
import RecurringScopeDialog from './RecurringScopeDialog'

interface RecurringDeleteModalProps {
  open: boolean
  onClose: () => void
  onDeleteThisEvent: () => void
  onDeleteAllEvents: () => void
  busyScope: RecurringScopeBusyScope
}

export default function RecurringDeleteModal({
  open,
  onClose,
  onDeleteThisEvent,
  onDeleteAllEvents,
  busyScope
}: RecurringDeleteModalProps): React.JSX.Element {
  return (
    <RecurringScopeDialog
      open={open}
      onClose={onClose}
      kind="delete"
      busyScope={busyScope}
      onChooseInstance={onDeleteThisEvent}
      onChooseSeries={onDeleteAllEvents}
    />
  )
}
