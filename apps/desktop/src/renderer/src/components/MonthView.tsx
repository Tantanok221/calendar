import { useState } from 'react'
import { EVENT_COLORS, isSameDay, toDateStr } from '../data/events'
import type { CalendarEvent } from '../data/events'
import { computeAnchor } from '../lib/eventPopoverAnchor'
import type { PopoverAnchor } from '../lib/eventPopoverAnchor'
import type { RendererCalendar } from '../lib/googleCalendarSync'
import EventDetailPopover from './EventDetailPopover'

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1 // Monday start
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function EventPill({
  event,
  selected,
  onClick
}: {
  event: CalendarEvent
  selected: boolean
  onClick: (e: React.MouseEvent, ev: CalendarEvent) => void
}): React.JSX.Element {
  const c = EVENT_COLORS[event.color]
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] leading-tight truncate cursor-pointer transition-all duration-100 mb-0.5"
      style={{
        background: selected ? c.pillBg.replace('0.18', '0.32') : c.pillBg,
        color: c.text,
        outline: selected ? `1px solid ${c.dot}` : 'none',
        outlineOffset: -1
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(e, event)
      }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.2)')}
      onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      <span className="truncate font-medium">{event.title}</span>
    </div>
  )
}

interface MonthViewProps {
  events: CalendarEvent[]
  calendars: RendererCalendar[]
  currentDate: Date
  today: Date
  onDateSelect: (d: Date) => void
  onEventChange: (event: CalendarEvent) => Promise<void> | void
  onEventDelete: (event: CalendarEvent) => Promise<void> | void
}

export default function MonthView({
  events,
  calendars,
  currentDate,
  today,
  onDateSelect,
  onEventChange,
  onEventDelete
}: MonthViewProps): React.JSX.Element {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const cells = getMonthGrid(year, month)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [popoverAnchor, setPopoverAnchor] = useState<PopoverAnchor | null>(null)
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null

  const eventsForDate = (date: Date): CalendarEvent[] =>
    events.filter((event) => event.date === toDateStr(date))

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent): void => {
    if (selectedEventId === event.id) {
      setSelectedEventId(null)
      setPopoverAnchor(null)
      return
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopoverAnchor(computeAnchor(rect))
    setSelectedEventId(event.id)
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--bg)' }}
      onClick={() => {
        setSelectedEventId(null)
        setPopoverAnchor(null)
      }}
    >
      {selectedEvent && popoverAnchor && (
        <EventDetailPopover
          event={selectedEvent}
          anchor={popoverAnchor}
          calendars={calendars}
          onSave={onEventChange}
          onDelete={onEventDelete}
          onClose={() => {
            setSelectedEventId(null)
            setPopoverAnchor(null)
          }}
        />
      )}
      {/* Day-of-week header */}
      <div
        className="grid shrink-0"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        {DOW_LABELS.map((d) => (
          <div key={d} className="py-2 text-center">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-dim)' }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="month-grid flex-1 min-h-0">
        {cells.map((date, i) => {
          const isToday = date ? isSameDay(date, today) : false
          const isCurrentMonth = date ? date.getMonth() === month : false
          const dayEvents = date ? eventsForDate(date) : []
          const allDayEvents = dayEvents.filter((e) => e.allDay)
          const timedEvents = dayEvents.filter((e) => !e.allDay)
          const shown = [...allDayEvents, ...timedEvents].slice(0, 3)
          const extra = dayEvents.length - shown.length

          return (
            <div
              key={i}
              onClick={() => date && onDateSelect(date)}
              className="p-1.5 overflow-hidden transition-colors duration-100 cursor-pointer"
              style={{
                borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                background: isToday ? 'var(--accent-bg)' : 'transparent',
                opacity: isCurrentMonth ? 1 : 0.35
              }}
              onMouseEnter={(e) => {
                if (!isToday) e.currentTarget.style.background = 'var(--surface-2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isToday ? 'var(--accent-bg)' : 'transparent'
              }}
            >
              {date && (
                <>
                  {/* Day number */}
                  <div className="flex items-center justify-end mb-1 pr-0.5">
                    <span
                      className="flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-semibold leading-none"
                      style={
                        isToday
                          ? { background: 'var(--accent)', color: 'var(--accent-on)' }
                          : { color: isCurrentMonth ? 'var(--text)' : 'var(--text-dim)' }
                      }
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Events */}
                  <div>
                    {shown.map((e) => (
                      <EventPill
                        key={e.id}
                        event={e}
                        selected={selectedEventId === e.id}
                        onClick={handleEventClick}
                      />
                    ))}
                    {extra > 0 && (
                      <div
                        className="text-[10px] px-1.5 font-medium"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        +{extra} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
