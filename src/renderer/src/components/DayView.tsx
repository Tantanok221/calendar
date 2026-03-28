import { useEffect, useRef, useState } from 'react'
import {
  EVENTS,
  EVENT_COLORS,
  isSameDay,
  toDateStr,
  timeToMinutes,
  START_HOUR,
  END_HOUR,
  HOUR_HEIGHT
} from '../data/events'
import type { CalendarEvent } from '../data/events'

const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

function topPx(time: string): number {
  return ((timeToMinutes(time) - START_HOUR * 60) / 60) * HOUR_HEIGHT
}

function heightPx(start: string, end: string): number {
  return Math.max(((timeToMinutes(end) - timeToMinutes(start)) / 60) * HOUR_HEIGHT, 20)
}

function nowOffsetPx(): number {
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  const startMins = START_HOUR * 60
  const endMins = END_HOUR * 60
  if (mins < startMins || mins > endMins) return -1
  return ((mins - startMins) / 60) * HOUR_HEIGHT
}

function EventBlock({ event }: { event: CalendarEvent }): React.JSX.Element {
  const c = EVENT_COLORS[event.color]
  const top = topPx(event.startTime!)
  const height = heightPx(event.startTime!, event.endTime!)
  const short = height < 44

  return (
    <div
      className="event-block"
      style={{
        top,
        height,
        background: c.bg,
        borderLeftColor: c.dot,
        color: c.text,
        left: 8,
        right: 8
      }}
    >
      <p className="text-xs font-semibold leading-snug">{event.title}</p>
      {!short && (
        <p className="text-[11px] mt-0.5 opacity-70">
          {event.startTime} – {event.endTime}
        </p>
      )}
      {!short && event.calendar && (
        <p className="text-[10px] mt-0.5 opacity-50">{event.calendar}</p>
      )}
    </div>
  )
}

interface DayViewProps {
  currentDate: Date
  today: Date
}

export default function DayView({ currentDate, today }: DayViewProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [nowPx, setNowPx] = useState(nowOffsetPx)
  const isToday = isSameDay(currentDate, today)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT - 8
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNowPx(nowOffsetPx()), 60_000)
    return () => clearInterval(id)
  }, [])

  const dayStr = toDateStr(currentDate)
  const timedEvents = EVENTS.filter((e) => e.date === dayStr && !e.allDay && e.startTime)
  const allDayEvents = EVENTS.filter((e) => e.date === dayStr && e.allDay)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Day header */}
      <div
        className="shrink-0 px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center w-9 h-9 rounded-xl text-xl font-bold"
            style={
              isToday
                ? { background: 'var(--accent)', color: 'var(--accent-on)' }
                : { background: 'var(--surface-2)', color: 'var(--text)' }
            }
          >
            {currentDate.getDate()}
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text)' }}>
              {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <p className="text-[11px] leading-tight" style={{ color: 'var(--text-muted)' }}>
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {timedEvents.length > 0 && (
          <div
            className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            {timedEvents.length + allDayEvents.length} event
            {timedEvents.length + allDayEvents.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* All-day strip */}
      {allDayEvents.length > 0 && (
        <div
          className="shrink-0 flex items-center gap-1 px-4 py-2"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <span
            className="text-[10px] uppercase tracking-wider mr-1"
            style={{ color: 'var(--text-dim)', minWidth: 46 }}
          >
            All day
          </span>
          {allDayEvents.map((e) => {
            const c = EVENT_COLORS[e.color]
            return (
              <div
                key={e.id}
                className="px-2 py-0.5 rounded text-[11px] font-medium"
                style={{ background: c.pillBg, color: c.text }}
              >
                {e.title}
              </div>
            )
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="time-grid-scroll" ref={scrollRef}>
        <div className="grid" style={{ gridTemplateColumns: `var(--time-col-w) 1fr` }}>
          {/* Time labels — absolutely positioned so labels never touch grid lines */}
          <div className="relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
            {HOURS.map((h, i) => (
              <span
                key={h}
                className="absolute right-2 text-[10px] font-medium select-none"
                style={{
                  top: i === 0 ? 4 : (h - START_HOUR) * HOUR_HEIGHT,
                  transform: i === 0 ? 'none' : 'translateY(-50%)',
                  color: 'var(--text-dim)'
                }}
              >
                {formatHour(h)}
              </span>
            ))}
          </div>

          {/* Event column */}
          <div
            className="day-col-inner"
            style={{
              height: (END_HOUR - START_HOUR) * HOUR_HEIGHT,
              background: 'transparent'
            }}
          >
            {/* Hour lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: (h - START_HOUR) * HOUR_HEIGHT,
                  height: 1,
                  background: 'var(--border)'
                }}
              />
            ))}

            {/* Events */}
            {timedEvents.map((e) => (
              <EventBlock key={e.id} event={e} />
            ))}

            {/* Now line */}
            {isToday && nowPx >= 0 && (
              <div className="now-line" style={{ top: nowPx }}>
                <div className="now-dot" />
                <div className="now-bar" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
