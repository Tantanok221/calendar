import { useState } from 'react'
import { CaretLeft, CaretRight, Plus } from '@phosphor-icons/react'
import { EVENT_COLORS, getWeekStart, isSameDay } from '../data/events'
import type { CalendarEvent } from '../data/events'
import type { ViewType } from './TopBar'
import NewEventPopover from './NewEventPopover'
import { DEFAULT_RENDERER_CALENDARS, type RendererCalendar } from '../lib/googleCalendarSync'
import type { CreateCalendarEventDraft } from '../lib/googleCalendarCreate'

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function getMiniGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1 // Monday start
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function datesForEventDots(events: CalendarEvent[], year: number, month: number): Set<number> {
  const s = new Set<number>()
  events.forEach((e) => {
    const [y, m, d] = e.date.split('-').map(Number)
    if (y === year && m === month + 1) s.add(d)
  })
  return s
}

interface MiniCalendarProps {
  events: CalendarEvent[]
  currentDate: Date
  today: Date
  view: ViewType
  onDateSelect: (d: Date) => void
}

function MiniCalendar({
  events,
  currentDate,
  today,
  view,
  onDateSelect
}: MiniCalendarProps): React.JSX.Element {
  const [miniYear, setMiniYear] = useState(currentDate.getFullYear())
  const [miniMonth, setMiniMonth] = useState(currentDate.getMonth())

  const cells = getMiniGrid(miniYear, miniMonth)
  const eventDays = datesForEventDots(events, miniYear, miniMonth)
  const weekStart = getWeekStart(currentDate)

  const navMonth = (dir: 1 | -1): void => {
    const d = new Date(miniYear, miniMonth + dir, 1)
    setMiniYear(d.getFullYear())
    setMiniMonth(d.getMonth())
  }

  const monthLabel = new Date(miniYear, miniMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="px-3 pt-3 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
          {monthLabel}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => navMonth(-1)}
            className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <CaretLeft size={11} weight="bold" />
          </button>
          <button
            onClick={() => navMonth(1)}
            className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <CaretRight size={11} weight="bold" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="mini-cal-grid mb-1">
        {DOW.map((d, i) => (
          <div key={i} className="flex items-center justify-center h-6 text-center">
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="mini-cal-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-6" />
          const date = new Date(miniYear, miniMonth, day)
          const isT = isSameDay(date, today)
          const isSel = isSameDay(date, currentDate)
          const inWeek =
            view === 'week' &&
            date >= weekStart &&
            date < new Date(weekStart.getTime() + 7 * 86400000)
          const hasEvent = eventDays.has(day)
          const isCurrentMonth = true

          return (
            <button
              key={i}
              onClick={() => onDateSelect(date)}
              className="flex flex-col items-center justify-center h-6 w-full rounded transition-all duration-100 relative"
              style={{
                background: isT
                  ? 'var(--accent)'
                  : inWeek
                    ? 'var(--accent-bg)'
                    : isSel
                      ? 'var(--surface-3)'
                      : 'transparent',
                color: isT ? 'var(--accent-on)' : isCurrentMonth ? 'var(--text)' : 'var(--text-dim)'
              }}
              onMouseEnter={(e) => {
                if (!isT && !inWeek) e.currentTarget.style.background = 'var(--surface-2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isT
                  ? 'var(--accent)'
                  : inWeek
                    ? 'var(--accent-bg)'
                    : isSel
                      ? 'var(--surface-3)'
                      : 'transparent'
              }}
            >
              <span className="text-[11px] leading-none font-medium">{day}</span>
              {hasEvent && !isT && (
                <span
                  className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface SidebarProps {
  calendars?: RendererCalendar[]
  events: CalendarEvent[]
  currentDate: Date
  today: Date
  view: ViewType
  onDateSelect: (d: Date) => void
  onCreateEvent: (draft: CreateCalendarEventDraft) => Promise<void>
}

export default function Sidebar({
  calendars = DEFAULT_RENDERER_CALENDARS,
  events,
  currentDate,
  today,
  view,
  onDateSelect,
  onCreateEvent
}: SidebarProps): React.JSX.Element {
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [newEventKey, setNewEventKey] = useState(0)

  const openNewEvent = (): void => {
    setNewEventKey((value) => value + 1)
    setShowNewEvent(true)
  }

  return (
    <div
      className="flex flex-col shrink-0 overflow-y-auto"
      style={{
        width: 'var(--sidebar-w)',
        borderRight: '1px solid var(--border)',
        background: 'var(--surface)'
      }}
    >
      {/* macOS traffic-light spacer — draggable so window can still be moved */}
      <div className="drag-region shrink-0" style={{ height: 'var(--traffic-light-h)' }} />

      {/* New Event button */}
      <div className="px-3 pt-1 pb-1">
        <button
          onClick={openNewEvent}
          className="w-full flex items-center justify-center gap-2 px-3 h-8 rounded-lg text-xs font-medium transition-all duration-100"
          style={{
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent-text)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(215,206,178,0.18)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-bg)')}
        >
          <Plus size={12} weight="bold" />
          New Event
        </button>
      </div>

      <NewEventPopover
        key={newEventKey}
        open={showNewEvent}
        onClose={() => setShowNewEvent(false)}
        calendars={calendars}
        onCreateEvent={onCreateEvent}
      />

      {/* Mini calendar */}
      <MiniCalendar
        events={events}
        currentDate={currentDate}
        today={today}
        view={view}
        onDateSelect={onDateSelect}
      />

      {/* Divider */}
      <div className="mx-3 my-1" style={{ height: 1, background: 'var(--border)' }} />

      {/* Calendars */}
      <div className="px-3 py-2">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
          style={{ color: 'var(--text-dim)' }}
        >
          My Calendars
        </p>
        <div className="flex flex-col gap-0.5">
          {calendars.map((cal) => (
            <label
              key={cal.name}
              className="flex items-center gap-2 px-1.5 h-7 rounded-md cursor-pointer transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: EVENT_COLORS[cal.color].dot }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {cal.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 my-1" style={{ height: 1, background: 'var(--border)' }} />

      {/* Other calendars */}
      <div className="px-3 py-2">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
          style={{ color: 'var(--text-dim)' }}
        >
          Other
        </p>
        <label
          className="flex items-center gap-2 px-1.5 h-7 rounded-md cursor-pointer transition-colors"
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: 'rgba(215,206,178,0.35)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Holidays
          </span>
        </label>
      </div>
    </div>
  )
}
