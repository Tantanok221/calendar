import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DragDropProvider, useDraggable, useDroppable } from '@dnd-kit/react'
import {
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
import { computeAnchor } from '../lib/eventPopoverAnchor'
import type { PopoverAnchor } from '../lib/eventPopoverAnchor'
import {
  buildAllDayDropSlotId,
  buildDropSlotId,
  getTimedDragPreviewRange,
  getTimedResizeBoundaryMinutes,
  getTimedSelectionRange,
  getTimedSlotStartMinutes,
  parseDropSlotId,
  resizeTimedEvent,
  rescheduleAllDayEvent,
  rescheduleTimedEvent,
  SNAP_MINUTES,
  type TimedEventResizeEdge,
  type TimedSelectionRange
} from '../lib/calendarDrag'
import { buildCalendarHours, formatCalendarHour } from '../lib/calendarHours'
import type { RendererCalendar } from '../lib/googleCalendarSync'
import { buildTimedEventLayout } from '../lib/timedEventLayout'
import type { TimedEventLayout } from '../lib/timedEventLayout'
import { isCalendarEventEditable } from '../lib/calendarPermissions'
import { getEventPrimaryLabel, getEventSecondaryLabel } from '../lib/eventLocationDisplay'
import EventDetailPopover from './EventDetailPopover'

const HOURS = buildCalendarHours(START_HOUR, END_HOUR)
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SLOT_STARTS = Array.from(
  { length: ((END_HOUR - START_HOUR) * 60) / SNAP_MINUTES },
  (_, index) => START_HOUR * 60 + index * SNAP_MINUTES
)
type DragStartPayload = Parameters<
  NonNullable<React.ComponentProps<typeof DragDropProvider>['onDragStart']>
>[0]
type DragEndPayload = Parameters<
  NonNullable<React.ComponentProps<typeof DragDropProvider>['onDragEnd']>
>[0]

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

function parseEventDragId(id: string | number): string | null {
  const value = String(id)
  return value.startsWith('event:') ? value.slice(6) : null
}

function dateFromDateStr(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function TimedEventCard({
  event,
  layout,
  editable,
  selected,
  dragging,
  resizing,
  onClick,
  dragHandleRef,
  onResizeStart
}: {
  event: CalendarEvent
  layout: TimedEventLayout
  editable: boolean
  selected: boolean
  dragging: boolean
  resizing: boolean
  onClick: (e: React.MouseEvent, ev: CalendarEvent) => void
  dragHandleRef?: (element: Element | null) => void
  onResizeStart: (event: React.PointerEvent<HTMLDivElement>, edge: TimedEventResizeEdge) => void
}): React.JSX.Element {
  const color = EVENT_COLORS[event.color]
  const top = topPx(event.startTime!)
  const height = heightPx(event.startTime!, event.endTime!)
  const short = height < 36
  const primaryLabel = short ? getEventPrimaryLabel(event) : event.title
  const secondaryLabel = getEventSecondaryLabel(event)
  const left = `calc(${(layout.columnIndex / layout.columnCount) * 100}% + 4px)`
  const right = `calc(${((layout.columnCount - layout.columnIndex - 1) / layout.columnCount) * 100}% + 4px)`

  return (
    <motion.div
      className="event-block"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: dragging ? 0.28 : 1, y: 0 }}
      exit={{ opacity: 0, y: -3 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(e, event)
      }}
      style={{
        top,
        height,
        background: selected ? color.bg.replace('0.13', '0.22') : color.bg,
        borderLeftColor: color.dot,
        color: color.text,
        left,
        right,
        cursor: editable ? 'pointer' : 'default',
        outline: selected ? `1px solid ${color.dot}` : 'none',
        outlineOffset: -1,
        zIndex: dragging || resizing ? 20 : selected ? 12 : 2,
        boxShadow: dragging || resizing ? '0 10px 24px rgba(0,0,0,0.22)' : 'none'
      }}
    >
      {editable && (
        <>
          <div
            ref={dragHandleRef}
            aria-hidden="true"
            className="event-drag-surface"
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
          />
          <div
            aria-hidden="true"
            className="event-resize-handle event-resize-handle-top"
            onPointerDown={(pointerEvent) => onResizeStart(pointerEvent, 'start')}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          />
          <div
            aria-hidden="true"
            className="event-resize-handle event-resize-handle-bottom"
            onPointerDown={(pointerEvent) => onResizeStart(pointerEvent, 'end')}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          />
        </>
      )}
      <div className="relative z-0 pointer-events-none">
        <p className="text-[11px] font-semibold leading-tight truncate">{primaryLabel}</p>
        {!short && (
          <p className="text-[10px] leading-tight mt-0.5 opacity-70">
            {event.startTime} – {event.endTime}
            {secondaryLabel ? ` • ${secondaryLabel}` : ''}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function DraggableEventBlock({
  event,
  layout,
  editable,
  selected,
  resizing,
  onClick,
  onResizeStart
}: {
  event: CalendarEvent
  layout: TimedEventLayout
  editable: boolean
  selected: boolean
  resizing: boolean
  onClick: (e: React.MouseEvent, ev: CalendarEvent) => void
  onResizeStart: (event: React.PointerEvent<HTMLDivElement>, edge: TimedEventResizeEdge) => void
}): React.JSX.Element {
  const { ref, isDragging } = useDraggable({
    id: `event:${event.id}`,
    data: { eventId: event.id }
  })

  return (
    <TimedEventCard
      event={event}
      layout={layout}
      editable={editable}
      selected={selected}
      dragging={isDragging}
      resizing={resizing}
      onClick={onClick}
      dragHandleRef={ref}
      onResizeStart={onResizeStart}
    />
  )
}

function AllDayEventPill({
  event,
  editable,
  selected,
  dragging,
  onClick,
  elementRef
}: {
  event: CalendarEvent
  editable: boolean
  selected: boolean
  dragging: boolean
  onClick: (e: React.MouseEvent, ev: CalendarEvent) => void
  elementRef?: (element: Element | null) => void
}): React.JSX.Element {
  const color = EVENT_COLORS[event.color]

  return (
    <motion.div
      ref={elementRef}
      className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate mb-0.5"
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: dragging ? 0.28 : 1, x: 0 }}
      exit={{ opacity: 0, x: -4 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(e, event)
      }}
      style={{
        background: selected ? color.pillBg.replace('0.18', '0.32') : color.pillBg,
        color: color.text,
        outline: selected ? `1px solid ${color.dot}` : 'none',
        outlineOffset: -1,
        cursor: editable ? (dragging ? 'grabbing' : 'grab') : 'default',
        boxShadow: dragging ? '0 10px 24px rgba(0,0,0,0.22)' : 'none',
        touchAction: 'none'
      }}
    >
      {getEventPrimaryLabel(event)}
    </motion.div>
  )
}

function DraggableAllDayEventPill({
  event,
  editable,
  selected,
  onClick
}: {
  event: CalendarEvent
  editable: boolean
  selected: boolean
  onClick: (e: React.MouseEvent, ev: CalendarEvent) => void
}): React.JSX.Element {
  const { ref, isDragging } = useDraggable({
    id: `event:${event.id}`,
    data: { eventId: event.id }
  })

  return (
    <AllDayEventPill
      event={event}
      editable={editable}
      selected={selected}
      dragging={isDragging}
      onClick={onClick}
      elementRef={editable ? ref : undefined}
    />
  )
}

function DropSlot({
  id,
  startMinutes,
  previewDurationMinutes
}: {
  id: string
  startMinutes: number
  previewDurationMinutes?: number
}): React.JSX.Element {
  const { ref, isDropTarget } = useDroppable({ id })
  const previewRange =
    previewDurationMinutes !== undefined
      ? getTimedDragPreviewRange(startMinutes, previewDurationMinutes)
      : null
  const top =
    ((previewRange?.startMinutes ?? startMinutes) - START_HOUR * 60) / 60 * HOUR_HEIGHT
  const height =
    (((previewRange?.endMinutes ?? startMinutes + SNAP_MINUTES) -
      (previewRange?.startMinutes ?? startMinutes)) /
      60) *
    HOUR_HEIGHT

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        height,
        pointerEvents: 'none',
        background: isDropTarget ? 'rgba(215,206,178,0.10)' : 'transparent',
        outline: isDropTarget ? '1px solid var(--accent-border)' : 'none',
        outlineOffset: -1,
        zIndex: 1
      }}
    />
  )
}

function AllDayDropSlot({ id, children }: { id: string; children: React.ReactNode }): React.JSX.Element {
  const { ref, isDropTarget } = useDroppable({ id })

  return (
    <div
      ref={ref}
      className="p-0.5 min-h-[24px]"
      style={{
        borderLeft: '1px solid var(--border)',
        background: isDropTarget ? 'rgba(215,206,178,0.10)' : 'transparent',
        outline: isDropTarget ? '1px solid var(--accent-border)' : 'none',
        outlineOffset: -1
      }}
    >
      {children}
    </div>
  )
}

interface WeekViewProps {
  events: CalendarEvent[]
  calendars: RendererCalendar[]
  currentDate: Date
  today: Date
  onDateSelect: (d: Date) => void
  onEventChange: (event: CalendarEvent) => Promise<void> | void
  onEventDelete: (event: CalendarEvent) => Promise<void> | void
  onTimedSelectionCreate: (date: Date, range: TimedSelectionRange) => void
}

export default function WeekView({
  events,
  calendars,
  currentDate,
  today,
  onDateSelect,
  onEventChange,
  onEventDelete,
  onTimedSelectionCreate
}: WeekViewProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  const suppressClickUntilRef = useRef(0)
  const [nowPx, setNowPx] = useState(nowOffsetPx)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [popoverAnchor, setPopoverAnchor] = useState<PopoverAnchor | null>(null)
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null)
  const [timedSelection, setTimedSelection] = useState<{
    anchorMinutes: number
    date: Date
    pointerId: number
    range: TimedSelectionRange
  } | null>(null)
  const [timedResize, setTimedResize] = useState<{
    edge: TimedEventResizeEdge
    eventId: string
    originalEvent: CalendarEvent
    pointerId: number
    previewEvent: CalendarEvent
  } | null>(null)
  const days = getWeekDays(currentDate)
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null

  const clearSelection = (): void => {
    setSelectedEventId(null)
    setPopoverAnchor(null)
  }

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent): void => {
    if (!isCalendarEventEditable(event, calendars)) {
      return
    }

    if (Date.now() < suppressClickUntilRef.current) return

    if (selectedEventId === event.id) {
      clearSelection()
      return
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopoverAnchor(computeAnchor(rect))
    setSelectedEventId(event.id)
  }

  const handleDragStart = ({ operation }: DragStartPayload): void => {
    const source = operation.source
    if (!source) return

    const eventId = parseEventDragId(source.id)
    if (!eventId) return

    const event = events.find((candidate) => candidate.id === eventId)

    if (!event || !isCalendarEventEditable(event, calendars)) {
      return
    }

    setDraggedEventId(eventId)
    clearSelection()
  }

  const handleDragEnd = ({ canceled, operation }: DragEndPayload): void => {
    const source = operation.source
    const target = operation.target
    if (!source) return

    const eventId = parseEventDragId(source.id)

    setDraggedEventId(null)

    if (!eventId) return

    suppressClickUntilRef.current = Date.now() + 250

    if (canceled || !target) return

    const event = events.find((candidate) => candidate.id === eventId)
    if (!event || !isCalendarEventEditable(event, calendars)) return

    const slot = parseDropSlotId(String(target.id))

    const nextDate = dateFromDateStr(slot.date)

    onEventChange(
      slot.lane === 'all-day'
        ? rescheduleAllDayEvent(event, nextDate)
        : rescheduleTimedEvent(event, {
            date: nextDate,
            startMinutes: slot.startMinutes ?? START_HOUR * 60
          })
    )
  }

  const handleTimedGridPointerDown =
    (date: Date) =>
    (event: React.PointerEvent<HTMLDivElement>): void => {
      if (event.button !== 0 || draggedEventId) return
      if (event.target instanceof Element && event.target.closest('.event-block')) return

      const rect = event.currentTarget.getBoundingClientRect()
      const anchorMinutes = getTimedSlotStartMinutes(event.clientY - rect.top)
      const range = getTimedSelectionRange(anchorMinutes, anchorMinutes)

      clearSelection()
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      setTimedSelection({
        anchorMinutes,
        date,
        pointerId: event.pointerId,
        range
      })
    }

  const handleTimedGridPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect()

    if (timedResize && timedResize.pointerId === event.pointerId) {
      const boundaryMinutes = getTimedResizeBoundaryMinutes(event.clientY - rect.top)

      setTimedResize((currentResize) => {
        if (!currentResize || currentResize.pointerId !== event.pointerId) {
          return currentResize
        }

        const previewEvent = resizeTimedEvent(currentResize.originalEvent, {
          edge: currentResize.edge,
          boundaryMinutes
        })

        if (
          previewEvent.startTime === currentResize.previewEvent.startTime &&
          previewEvent.endTime === currentResize.previewEvent.endTime
        ) {
          return currentResize
        }

        return {
          ...currentResize,
          previewEvent
        }
      })
      return
    }

    const currentMinutes = getTimedSlotStartMinutes(event.clientY - rect.top)

    setTimedSelection((currentSelection) => {
      if (!currentSelection || currentSelection.pointerId !== event.pointerId) {
        return currentSelection
      }

      const range = getTimedSelectionRange(currentSelection.anchorMinutes, currentMinutes)

      if (
        range.startMinutes === currentSelection.range.startMinutes &&
        range.endMinutes === currentSelection.range.endMinutes
      ) {
        return currentSelection
      }

      return {
        ...currentSelection,
        range
      }
    })
  }

  const finishTimedSelection = (
    event: React.PointerEvent<HTMLDivElement>,
    shouldCreate: boolean
  ): void => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (timedResize && timedResize.pointerId === event.pointerId) {
      if (shouldCreate) {
        suppressClickUntilRef.current = Date.now() + 250

        if (
          timedResize.previewEvent.startTime !== timedResize.originalEvent.startTime ||
          timedResize.previewEvent.endTime !== timedResize.originalEvent.endTime
        ) {
          onEventChange(timedResize.previewEvent)
        }
      }

      setTimedResize(null)
      return
    }

    setTimedSelection((currentSelection) => {
      if (!currentSelection || currentSelection.pointerId !== event.pointerId) {
        return currentSelection
      }

      if (shouldCreate) {
        suppressClickUntilRef.current = Date.now() + 250
        onTimedSelectionCreate(currentSelection.date, currentSelection.range)
      }

      return null
    })
  }

  const handleTimedEventResizeStart =
    (eventToResize: CalendarEvent) =>
    (pointerEvent: React.PointerEvent<HTMLDivElement>, edge: TimedEventResizeEdge): void => {
      if (!isCalendarEventEditable(eventToResize, calendars)) return
      if (pointerEvent.button !== 0 || draggedEventId) return

      const dayColumn = pointerEvent.currentTarget.closest('.day-col-inner')
      if (!(dayColumn instanceof HTMLDivElement)) return

      clearSelection()
      pointerEvent.preventDefault()
      pointerEvent.stopPropagation()
      pointerEvent.nativeEvent.stopImmediatePropagation()
      dayColumn.setPointerCapture(pointerEvent.pointerId)
      setTimedResize({
        edge,
        eventId: eventToResize.id,
        originalEvent: eventToResize,
        pointerId: pointerEvent.pointerId,
        previewEvent: eventToResize
      })
    }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT - 8
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNowPx(nowOffsetPx()), 60_000)
    return () => clearInterval(id)
  }, [])

  const timedEvents = (day: Date): CalendarEvent[] =>
    events
      .filter(
        (event) =>
          event.date === toDateStr(day) && !event.allDay && event.startTime && event.endTime
      )
      .sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!))

  const allDayEvents = (day: Date): CalendarEvent[] =>
    events.filter((event) => event.date === toDateStr(day) && event.allDay)

  const hasAnyAllDay = days.some((day) => allDayEvents(day).length > 0)
  const draggedTimedEvent = draggedEventId
    ? events.find(
        (event) =>
          event.id === draggedEventId && !event.allDay && event.startTime && event.endTime
      )
    : null
  const draggedTimedEventDurationMinutes =
    draggedTimedEvent?.startTime && draggedTimedEvent.endTime
      ? timeToMinutes(draggedTimedEvent.endTime) - timeToMinutes(draggedTimedEvent.startTime)
      : undefined

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className="flex flex-col h-full"
        style={{ background: 'var(--bg)' }}
        onClick={() => {
          clearSelection()
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
              clearSelection()
            }}
          />
        )}
        <div
          className="shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
        >
          <div className="grid" style={{ gridTemplateColumns: `var(--time-col-w) repeat(7, 1fr)` }}>
            <div />
            {days.map((day, index) => {
              const isToday = isSameDay(day, today)
              return (
                <button
                  key={toDateStr(day)}
                  onClick={() => onDateSelect(day)}
                  className="flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: isToday ? 'var(--accent-text)' : 'var(--text-dim)' }}
                  >
                    {DOW[index]}
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
              {days.map((day) => {
                const dayEvents = allDayEvents(day)
                return (
                  <AllDayDropSlot
                    key={`all-day-${toDateStr(day)}`}
                    id={buildAllDayDropSlotId('week', day)}
                  >
                    <AnimatePresence>
                      {dayEvents.map((event) => (
                        <DraggableAllDayEventPill
                          key={event.id}
                          event={event}
                          editable={isCalendarEventEditable(event, calendars)}
                          selected={selectedEventId === event.id}
                          onClick={handleEventClick}
                        />
                      ))}
                    </AnimatePresence>
                  </AllDayDropSlot>
                )
              })}
            </div>
          )}
        </div>

        <div className="time-grid-scroll" ref={scrollRef}>
          <div className="grid" style={{ gridTemplateColumns: `var(--time-col-w) repeat(7, 1fr)` }}>
            <div className="relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
              {HOURS.map((hour, index) => (
                <span
                  key={hour}
                  className="absolute right-2 text-[10px] font-medium select-none"
                  style={{
                    top: index === 0 ? 4 : (hour - START_HOUR) * HOUR_HEIGHT,
                    transform: index === 0 ? 'none' : 'translateY(-50%)',
                    color: 'var(--text-dim)'
                  }}
                >
                  {formatCalendarHour(hour)}
                </span>
              ))}
            </div>

            {days.map((day) => {
              const isToday = isSameDay(day, today)
              const dayTimedEvents = timedEvents(day).map((event) =>
                timedResize?.eventId === event.id ? timedResize.previewEvent : event
              )
              const dayTimedEventLayout = buildTimedEventLayout(dayTimedEvents)
              return (
                <div
                  key={toDateStr(day)}
                  className="day-col-inner"
                  style={isToday ? { borderLeft: '1px solid var(--border)' } : {}}
                  onPointerDown={handleTimedGridPointerDown(day)}
                  onPointerMove={handleTimedGridPointerMove}
                  onPointerUp={(event) => finishTimedSelection(event, true)}
                  onPointerCancel={(event) => finishTimedSelection(event, false)}
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: (hour - START_HOUR) * HOUR_HEIGHT,
                        height: 1,
                        background: 'var(--border)'
                      }}
                    />
                  ))}

                  {SLOT_STARTS.map((startMinutes) => (
                    <DropSlot
                      key={`${toDateStr(day)}-${startMinutes}`}
                      id={buildDropSlotId('week', day, startMinutes)}
                      startMinutes={startMinutes}
                      previewDurationMinutes={draggedTimedEventDurationMinutes}
                    />
                  ))}

                  {timedSelection && isSameDay(timedSelection.date, day) && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 4,
                        right: 4,
                        top:
                          ((timedSelection.range.startMinutes - START_HOUR * 60) / 60) *
                          HOUR_HEIGHT,
                        height:
                          ((timedSelection.range.endMinutes - timedSelection.range.startMinutes) /
                            60) *
                          HOUR_HEIGHT,
                        borderRadius: 4,
                        background: 'rgba(215,206,178,0.20)',
                        border: '1px solid var(--accent-border)',
                        boxShadow: 'inset 0 0 0 1px rgba(215,206,178,0.12)',
                        pointerEvents: 'none',
                        zIndex: 3
                      }}
                    />
                  )}

                  <AnimatePresence>
                    {dayTimedEvents.map((event) => (
                      <DraggableEventBlock
                        key={event.id}
                        event={event}
                        layout={
                          dayTimedEventLayout[event.id] ?? { columnIndex: 0, columnCount: 1 }
                        }
                        editable={isCalendarEventEditable(event, calendars)}
                        event={event}
                        layout={
                          dayTimedEventLayout[event.id] ?? { columnIndex: 0, columnCount: 1 }
                        }
                        selected={selectedEventId === event.id}
                        resizing={timedResize?.eventId === event.id}
                        onClick={handleEventClick}
                        onResizeStart={handleTimedEventResizeStart(event)}
                      />
                    ))}
                  </AnimatePresence>

                  {isToday && nowPx >= 0 && (
                    <div className="now-line" style={{ top: nowPx }}>
                      <div className="now-dot" />
                      <div className="now-bar" />
                    </div>
                  )}

                  {draggedEventId && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        background: 'rgba(12, 13, 14, 0.03)'
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DragDropProvider>
  )
}
