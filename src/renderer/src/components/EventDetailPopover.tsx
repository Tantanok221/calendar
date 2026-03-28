import { useEffect, useRef } from 'react'
import { CalendarBlank, Clock, X } from '@phosphor-icons/react'
import { EVENT_COLORS } from '../data/events'
import type { CalendarEvent } from '../data/events'
import type { PopoverAnchor } from '../lib/eventPopoverAnchor'

interface Props {
  event: CalendarEvent
  anchor: PopoverAnchor
  onClose: () => void
}

function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return m === 0 ? `${hr} ${ap}` : `${hr}:${String(m).padStart(2, '0')} ${ap}`
}

function fmtDate(s: string): string {
  const [y, mo, d] = s.split('-').map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

export default function EventDetailPopover({ event, anchor, onClose }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const c = EVENT_COLORS[event.color]

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    const onMouse = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    // slight delay so the click that opened it doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', onMouse), 50)
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
      document.removeEventListener('mousedown', onMouse)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: anchor.top,
        left: anchor.left,
        width: 228,
        zIndex: 300,
        background: 'var(--surface-2)',
        border: '1px solid var(--border-strong)',
        borderRadius: 10,
        boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
        animation: 'popover-in 140ms ease',
        overflow: 'hidden'
      }}
    >
      {/* accent top bar */}
      <div style={{ height: 3, background: c.dot }} />

      <div style={{ padding: '10px 12px 13px' }}>
        {/* title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 10
          }}
        >
          <p
            style={{
              color: 'var(--text)',
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.35,
              flex: 1
            }}
          >
            {event.title}
          </p>
          <button
            onClick={onClose}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'var(--surface-3)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-strong)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-3)')}
          >
            <X size={10} weight="bold" />
          </button>
        </div>

        {/* date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            marginBottom: 6,
            color: 'var(--text-dim)'
          }}
        >
          <CalendarBlank size={12} weight="regular" />
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{fmtDate(event.date)}</span>
        </div>

        {/* time */}
        {event.allDay ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              marginBottom: 6,
              color: 'var(--text-dim)'
            }}
          >
            <Clock size={12} weight="regular" />
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>All day</span>
          </div>
        ) : event.startTime && event.endTime ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              marginBottom: 6,
              color: 'var(--text-dim)'
            }}
          >
            <Clock size={12} weight="regular" />
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {fmt12(event.startTime)} – {fmt12(event.endTime)}
            </span>
          </div>
        ) : null}

        {/* calendar badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 2 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: c.dot,
              flexShrink: 0,
              display: 'inline-block'
            }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{event.calendar}</span>
        </div>
      </div>
    </div>
  )
}
