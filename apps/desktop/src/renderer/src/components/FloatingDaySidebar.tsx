import { motion } from 'framer-motion'
import DayView from './DayView'
import type { CalendarEvent } from '../data/events'
import { isSameDay } from '../data/events'
import type { RendererCalendar } from '../lib/googleCalendarSync'
import type { TimedSelectionRange } from '../lib/calendarDrag'
import type { GoogleCalendarDeleteScope } from '../lib/googleCalendarWriteback'
import type { PopoverAnchor } from '../lib/eventPopoverAnchor'

interface FloatingDaySidebarProps {
  events: CalendarEvent[]
  calendars: RendererCalendar[]
  currentDate: Date
  today: Date
  onEventChange: (event: CalendarEvent) => Promise<void> | void
  onEventDelete: (event: CalendarEvent, scope?: GoogleCalendarDeleteScope) => Promise<void> | void
  onCopyEvent?: (event: CalendarEvent) => void
  onAllDayCreate: (date: Date, anchor: PopoverAnchor) => void
  onTimedSelectionCreate: (date: Date, range: TimedSelectionRange, anchor: PopoverAnchor) => void
  newEventOpen?: boolean
  allDayPreviewDate?: Date
  pinnedSelection?: { date: Date; startMinutes: number; endMinutes: number }
  onPinnedSelectionChange?: (date: Date, range: TimedSelectionRange) => void
}

export default function FloatingDaySidebar({
  events,
  calendars,
  currentDate,
  today,
  onEventChange,
  onEventDelete,
  onCopyEvent,
  onAllDayCreate,
  onTimedSelectionCreate,
  newEventOpen,
  allDayPreviewDate,
  pinnedSelection,
  onPinnedSelectionChange
}: FloatingDaySidebarProps): React.JSX.Element {
  const title = isSameDay(currentDate, today)
    ? 'Today'
    : currentDate.toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <motion.div
      className="flex flex-col h-screen overflow-hidden"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      style={{
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border-strong)'
      }}
    >
      <div className="drag-region shrink-0" style={{ height: '28px' }} />

      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {title}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <DayView
          events={events}
          calendars={calendars}
          currentDate={currentDate}
          today={today}
          onEventChange={onEventChange}
          onEventDelete={onEventDelete}
          onCopyEvent={onCopyEvent}
          onAllDayCreate={onAllDayCreate}
          onTimedSelectionCreate={onTimedSelectionCreate}
          initialScrollAnchor="current-time"
          showHeader={false}
          newEventOpen={newEventOpen}
          allDayPreviewDate={allDayPreviewDate}
          pinnedSelection={pinnedSelection}
          onPinnedSelectionChange={onPinnedSelectionChange}
        />
      </div>
    </motion.div>
  )
}
