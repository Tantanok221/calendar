import { useEffect, useRef, useState } from 'react'
import {
  EVENTS,
  EVENT_COLORS,
  getWeekDays,
  isSameDay,
  toDateStr,
  timeToMinutes,
  START_HOUR,
  END_HOUR,
  HOUR_HEIGHT
} from '../data/events'
import type { CalendarEvent } from '../data/events'

const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
  const short = height < 36

  return (
    <div
      className="event-block"
      style={{
        top,
        height,
        background: c.bg,
        borderLeftColor: c.dot,
        color: c.text
      }}
    >
      <p className="text-[11px] font-semibold leading-tight truncate">{event.title}</p>
      {!short && (
        <p className="text-[10px] leading-tight mt-0.5 opacity-70">
          {event.startTime} – {event.endTime}
        </p>
      )}
    </div>
  )
}

interface WeekViewProps {
  currentDate: Date
  today: Date
  onDateSelect: (d: Date) => void
}

export default function WeekView({
  currentDate,
  today,
  onDateSelect
}: WeekViewProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [nowPx, setNowPx] = useState(nowOffsetPx)
  const days = getWeekDays(currentDate)

  // Scroll to ~8 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT - 8
    }
  }, [])

  // Update now-line every minute
  useEffect(() => {
    const id = setInterval(() => setNowPx(nowOffsetPx()), 60_000)
    return () => clearInterval(id)
  }, [])

  const timedEvents = (day: Date): CalendarEvent[] =>
    EVENTS.filter((e) => e.date === toDateStr(day) && !e.allDay && e.startTime && e.endTime)

  const allDayEvents = (day: Date): CalendarEvent[] =>
    EVENTS.filter((e) => e.date === toDateStr(day) && e.allDay)

  const hasAnyAllDay = days.some((d) => allDayEvents(d).length > 0)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Sticky header */}
      <div
        className="shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
      >
        {/* Day headers */}
        <div className="grid" style={{ gridTemplateColumns: `var(--time-col-w) repeat(7, 1fr)` }}>
          <div /> {/* time gutter */}
          {days.map((day, i) => {
            const isToday = isSameDay(day, today)
            return (
              <button
                key={i}
                onClick={() => onDateSelect(day)}
                className="flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: isToday ? 'var(--accent-text)' : 'var(--text-dim)' }}
                >
                  {DOW[i]}
                </span>
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
                  style={
                    isToday
                      ? { background: 'var(--accent)', color: 'var(--accent-on)' }
                      : { color: 'var(--text)' }
                  }
                >
                  {day.getDate()}
                </span>
              </button>
            )
          })}
        </div>

        {/* All-day strip */}
        {hasAnyAllDay && (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `var(--time-col-w) repeat(7, 1fr)`,
              borderTop: '1px solid var(--border)'
            }}
          >
            <div
              className="flex items-start justify-end pr-2 pt-1"
              style={{ color: 'var(--text-dim)' }}
            >
              <span className="text-[9px] uppercase tracking-wider">all‑day</span>
            </div>
            {days.map((day, i) => {
              const evts = allDayEvents(day)
              return (
                <div
                  key={i}
                  className="p-0.5 min-h-[24px]"
                  style={{ borderLeft: '1px solid var(--border)' }}
                >
                  {evts.map((e) => {
                    const c = EVENT_COLORS[e.color]
                    return (
                      <div
                        key={e.id}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate mb-0.5"
                        style={{ background: c.pillBg, color: c.text }}
                      >
                        {e.title}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Scrollable time grid */}
      <div className="time-grid-scroll" ref={scrollRef}>
        <div className="grid" style={{ gridTemplateColumns: `var(--time-col-w) repeat(7, 1fr)` }}>
          {/* Time labels column — absolutely positioned so labels never touch grid lines */}
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

          {/* Day columns */}
          {days.map((day, i) => {
            const isToday = isSameDay(day, today)
            return (
              <div
                key={i}
                className="day-col-inner"
                style={isToday ? { borderLeft: '1px solid var(--border)' } : {}}
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
                {timedEvents(day).map((e) => (
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
            )
          })}
        </div>
      </div>
    </div>
  )
}
