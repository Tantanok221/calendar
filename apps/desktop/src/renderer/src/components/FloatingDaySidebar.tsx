import { motion } from 'framer-motion'
import { X } from '@phosphor-icons/react'
import DayView from './DayView'
import type { CalendarEvent } from '../data/events'
import type { RendererCalendar } from '../lib/googleCalendarSync'
import type { TimedSelectionRange } from '../lib/calendarDrag'
import type { GoogleCalendarDeleteScope } from '../lib/googleCalendarWriteback'

interface FloatingDaySidebarProps {
  events: CalendarEvent[]
  calendars: RendererCalendar[]
  today: Date
  onClose: () => void
  onEventChange: (event: CalendarEvent) => Promise<void> | void
  onEventDelete: (event: CalendarEvent, scope?: GoogleCalendarDeleteScope) => Promise<void> | void
  onTimedSelectionCreate: (date: Date, range: TimedSelectionRange) => void
}

export default function FloatingDaySidebar({
  events,
  calendars,
  today,
  onClose,
  onEventChange,
  onEventDelete,
  onTimedSelectionCreate
}: FloatingDaySidebarProps): React.JSX.Element {
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
            Today
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
            {today.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <button
          onClick={onClose}
          className="no-drag flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = 'var(--surface-3)'
            event.currentTarget.style.color = 'var(--text-muted)'
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = 'transparent'
            event.currentTarget.style.color = 'var(--text-dim)'
          }}
          aria-label="Close floating day view"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <DayView
          events={events}
          calendars={calendars}
          currentDate={today}
          today={today}
          onEventChange={onEventChange}
          onEventDelete={onEventDelete}
          onTimedSelectionCreate={onTimedSelectionCreate}
          initialScrollAnchor="current-time"
          showHeader={false}
        />
      </div>
    </motion.div>
  )
}
