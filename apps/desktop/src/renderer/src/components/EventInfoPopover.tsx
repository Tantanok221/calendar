import { useEffect, useRef } from 'react'
import { CalendarBlank, Clock, MapPin, PencilSimple, Repeat, Trash, X } from '@phosphor-icons/react'
import { EVENT_COLORS, timeToMinutes } from '../data/events'
import type { CalendarEvent } from '../data/events'
import type { PopoverAnchor } from '../lib/eventPopoverAnchor'
import type { RendererCalendar } from '../lib/googleCalendarSync'
import { formatGoogleCalendarRecurrenceSummary } from '../lib/googleCalendarRecurrence'
import type { GoogleCalendarDeleteScope } from '../lib/googleCalendarWriteback'

interface Props {
  event: CalendarEvent
  anchor: PopoverAnchor
  calendars: RendererCalendar[]
  editable?: boolean
  onEdit: () => void
  onDelete: (event: CalendarEvent, scope?: GoogleCalendarDeleteScope) => Promise<void> | void
  onClose: () => void
}

function to12h(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ap}`
}

function formatDateLabel(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const date = new Date(y, mo - 1, d)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function getDurationLabel(startTime: string, endTime: string): string {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime)
  if (diff <= 0) return ''
  if (diff < 60) return `${diff}m`
  if (diff % 60 === 0) return `${diff / 60}h`
  return `${Math.floor(diff / 60)}h ${diff % 60}m`
}

export default function EventInfoPopover({
  event,
  anchor,
  calendars,
  editable = true,
  onEdit,
  onDelete,
  onClose
}: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const c = EVENT_COLORS[event.color]

  const calendar =
    calendars.find((cal) => cal.id === event.source?.calendarId) ??
    calendars.find((cal) => cal.name === event.calendar)
  const calendarColors = calendar ? EVENT_COLORS[calendar.color] : c

  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const hasTime = !event.allDay && event.startTime
  const dateLabel = formatDateLabel(event.date)
  const durationLabel =
    event.startTime && event.endTime ? getDurationLabel(event.startTime, event.endTime) : ''
  const recurrenceLabel =
    formatGoogleCalendarRecurrenceSummary(event.source?.recurrence) ??
    (event.source?.recurringEventId ? 'Repeats' : null)

  return (
    <div
      ref={ref}
      className="fixed z-50 flex flex-col outline-none"
      style={{
        top: anchor.top,
        left: anchor.left,
        width: 268,
        background: 'var(--surface-2)',
        borderTop: '1px solid var(--border-strong)',
        borderRight: '1px solid var(--border-strong)',
        borderBottom: '1px solid var(--border-strong)',
        borderLeft: `4px solid ${c.dot}`,
        borderRadius: 12,
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
        boxShadow: '0 20px 56px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        animation: 'eventInfoIn 160ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes eventInfoIn {
          from { opacity: 0; transform: scale(0.93) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>

      {/* Title + close */}
      <div
        className="flex items-start justify-between gap-2"
        style={{ padding: '13px 13px 10px 14px' }}
      >
        <h3
          className="flex-1 min-w-0 leading-snug"
          style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-word' }}
        >
          {event.title || 'Untitled event'}
        </h3>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-5 h-5 rounded-md transition-colors shrink-0 mt-0.5"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.15)'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-dim)'
          }}
        >
          <X size={11} weight="bold" />
        </button>
      </div>

      {/* All meta rows — unified gap */}
      <div style={{ padding: '0 14px 12px' }} className="flex flex-col gap-2">
        {/* Date */}
        <div className="flex items-center gap-2">
          <CalendarBlank size={12} style={{ color: c.text, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: c.text, fontWeight: 500 }}>
            {dateLabel}
            {event.allDay && <span style={{ marginLeft: 5, opacity: 0.65 }}>· All day</span>}
          </span>
        </div>
        {/* Time */}
        {hasTime && (
          <div className="flex items-center gap-2">
            <Clock size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text)' }}>
              {to12h(event.startTime!)}
              {event.endTime && (
                <>
                  <span style={{ color: 'var(--text-muted)', margin: '0 3px' }}>–</span>
                  {to12h(event.endTime)}
                </>
              )}
            </span>
            {durationLabel && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                  color: c.text,
                  background: c.pillBg,
                  padding: '1px 7px',
                  borderRadius: 999
                }}
              >
                {durationLabel}
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2">
            <MapPin size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span
              className="truncate"
              style={{ fontSize: 12, color: 'var(--text)' }}
              title={event.location}
            >
              {event.location}
            </span>
          </div>
        )}

        {/* Repeat */}
        {recurrenceLabel && (
          <div className="flex items-center gap-2">
            <Repeat size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text)' }}>{recurrenceLabel}</span>
          </div>
        )}

        {/* Calendar */}
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center shrink-0"
            style={{ width: 12, height: 12 }}
          >
            <span
              className="rounded-full"
              style={{ width: 8, height: 8, background: calendarColors.dot }}
            />
          </span>
          <span style={{ fontSize: 12, color: 'var(--text)' }}>{event.calendar}</span>
        </div>
      </div>

      {editable && (
        <>
          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* Actions */}
          <div className="flex items-center gap-1.5 px-3 py-2.5">
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-100"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            >
              <PencilSimple size={12} weight="bold" />
              Edit event
            </button>
            <button
              aria-label="Delete event"
              onClick={() => {
                onClose()
                void onDelete(event)
              }}
              className="flex items-center justify-center rounded-lg transition-all duration-100"
              style={{ width: 32, height: 32, color: 'var(--text-dim)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(192,120,96,0.12)'
                e.currentTarget.style.color = '#C98A76'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-dim)'
              }}
            >
              <Trash size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
