import type { RecurringScopeBusyScope } from '../lib/recurringScopeActions'
import RecurringScopeDialog from './RecurringScopeDialog'

interface RecurringEditModalProps {
  open: boolean
  onClose: () => void
  onEditThisEvent: () => void
  onEditAllEvents: () => void
  busyScope: RecurringScopeBusyScope
}

export default function RecurringEditModal({
  open,
  onClose,
  onEditThisEvent,
  onEditAllEvents,
  busyScope
}: RecurringEditModalProps): React.JSX.Element {
  return (
    <RecurringScopeDialog
      open={open}
      onClose={onClose}
      kind="edit"
      busyScope={busyScope}
      onChooseInstance={onEditThisEvent}
      onChooseSeries={onEditAllEvents}
    />
  )
}
