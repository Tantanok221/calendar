import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DragDropProvider, useDraggable, useDroppable } from '@dnd-kit/react'
import {
  EVENT_COLORS,
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
  type TimedSelectionRange,
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
  type TimedEventResizeEdge
} from '../lib/calendarDrag'
import { buildCalendarHours, formatCalendarHour } from '../lib/calendarHours'
import type { RendererCalendar } from '../lib/googleCalendarSync'
import { getAllDayEventPillMotion } from '../lib/eventMotion'
import EventDetailPopover from './EventDetailPopover'

const HOURS = buildCalendarHours(START_HOUR, END_HOUR)
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
  selected,
  dragging,
  resizing,
  onClick,
  dragHandleRef,
  onResizeStart
}: {
  event: CalendarEvent
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
  const short = height < 44

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
        left: 8,
        right: 8,
        outline: selected ? `1px solid ${color.dot}` : 'none',
        outlineOffset: -1,
        zIndex: dragging || resizing ? 20 : selected ? 12 : 2,
        boxShadow: dragging || resizing ? '0 10px 24px rgba(0,0,0,0.22)' : 'none'
      }}
    >
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
      <div className="relative z-0 pointer-events-none">
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
    </motion.div>
  )
}

function DraggableEventBlock({
  event,
  selected,
  resizing,
  onClick,
  onResizeStart
}: {
  event: CalendarEvent
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
  selected,
  dragging,
  onClick,
  elementRef,
  animateOnMount = true
}: {
  event: CalendarEvent
  selected: boolean
  dragging: boolean
  onClick: (e: React.MouseEvent, ev: CalendarEvent) => void
  elementRef?: (element: Element | null) => void
  animateOnMount?: boolean
}): React.JSX.Element {
  const color = EVENT_COLORS[event.color]
  const pillMotion = getAllDayEventPillMotion({ dragging, animateOnMount })

  return (
    <motion.div
      ref={elementRef}
      className="px-2 py-0.5 rounded text-[11px] font-medium"
      initial={pillMotion.initial}
      animate={pillMotion.animate}
      exit={pillMotion.exit}
      transition={pillMotion.transition}
      onClick={(e) => {
        e.stopPropagation()
        onClick(e, event)
      }}
      style={{
        background: selected ? color.pillBg.replace('0.18', '0.32') : color.pillBg,
        color: color.text,
        outline: selected ? `1px solid ${color.dot}` : 'none',
        outlineOffset: -1,
        cursor: dragging ? 'grabbing' : 'grab',
        boxShadow: dragging ? '0 10px 24px rgba(0,0,0,0.22)' : 'none',
        touchAction: 'none'
      }}
    >
      {event.title}
    </motion.div>
  )
}

function DraggableAllDayEventPill({
  event,
  selected,
  onClick,
  animateOnMount = true
}: {
  event: CalendarEvent
  selected: boolean
  onClick: (e: React.MouseEvent, ev: CalendarEvent) => void
  animateOnMount?: boolean
}): React.JSX.Element {
  const { ref, isDragging } = useDraggable({
    id: `event:${event.id}`,
    data: { eventId: event.id }
  })

  return (
    <AllDayEventPill
      event={event}
      selected={selected}
      dragging={isDragging}
      onClick={onClick}
      elementRef={ref}
      animateOnMount={animateOnMount}
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
      className="shrink-0 flex items-center gap-1 px-4 py-2"
      style={{
        borderBottom: '1px solid var(--border)',
        background: isDropTarget ? 'rgba(215,206,178,0.10)' : 'var(--surface)',
        outline: isDropTarget ? '1px solid var(--accent-border)' : 'none',
        outlineOffset: -1
      }}
    >
      {children}
    </div>
  )
}

interface DayViewProps {
  events: CalendarEvent[]
  calendars: RendererCalendar[]
  currentDate: Date
  today: Date
  onEventChange: (event: CalendarEvent) => Promise<void> | void
  onEventDelete: (event: CalendarEvent) => Promise<void> | void
  onTimedSelectionCreate: (date: Date, range: TimedSelectionRange) => void
}

export default function DayView({
  events,
  calendars,
  currentDate,
  today,
  onEventChange,
  onEventDelete,
  onTimedSelectionCreate
}: DayViewProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  const suppressClickUntilRef = useRef(0)
  const [nowPx, setNowPx] = useState(nowOffsetPx)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [popoverAnchor, setPopoverAnchor] = useState<PopoverAnchor | null>(null)
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null)
  const [timedSelection, setTimedSelection] = useState<{
    anchorMinutes: number
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
  const isToday = isSameDay(currentDate, today)
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null

  const clearSelection = (): void => {
    setSelectedEventId(null)
    setPopoverAnchor(null)
  }

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent): void => {
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
    if (!event) return

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

  const handleTimedGridPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
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
        onTimedSelectionCreate(currentDate, currentSelection.range)
      }

      return null
    })
  }

  const handleTimedEventResizeStart =
    (eventToResize: CalendarEvent) =>
    (pointerEvent: React.PointerEvent<HTMLDivElement>, edge: TimedEventResizeEdge): void => {
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

  const dayStr = toDateStr(currentDate)
  const timedEvents = events
    .filter((event) => event.date === dayStr && !event.allDay && event.startTime && event.endTime)
    .sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!))
  const allDayEvents = events.filter((event) => event.date === dayStr && event.allDay)
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
          <AllDayDropSlot id={buildAllDayDropSlotId('day', currentDate)}>
            <span
              className="text-[10px] uppercase tracking-wider mr-1"
              style={{ color: 'var(--text-dim)', minWidth: 46 }}
            >
              All day
            </span>
            <AnimatePresence>
              {allDayEvents.map((event) => (
                <DraggableAllDayEventPill
                  key={event.id}
                  event={event}
                  selected={selectedEventId === event.id}
                  onClick={handleEventClick}
                  animateOnMount={false}
                />
              ))}
            </AnimatePresence>
          </AllDayDropSlot>
        )}

        {/* Time grid */}
        <div className="time-grid-scroll" ref={scrollRef}>
          <div className="grid" style={{ gridTemplateColumns: `var(--time-col-w) 1fr` }}>
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

            <div
              className="day-col-inner"
              style={{
                height: (END_HOUR - START_HOUR) * HOUR_HEIGHT,
                background: 'transparent'
              }}
              onPointerDown={handleTimedGridPointerDown}
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
                  key={startMinutes}
                  id={buildDropSlotId('day', currentDate, startMinutes)}
                  startMinutes={startMinutes}
                  previewDurationMinutes={draggedTimedEventDurationMinutes}
                />
              ))}

              {timedSelection && (
                <div
                  style={{
                    position: 'absolute',
                    left: 4,
                    right: 4,
                    top: ((timedSelection.range.startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT,
                    height:
                      ((timedSelection.range.endMinutes - timedSelection.range.startMinutes) / 60) *
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
                {timedEvents.map((event) => (
                  <DraggableEventBlock
                    key={event.id}
                    event={timedResize?.eventId === event.id ? timedResize.previewEvent : event}
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
          </div>
        </div>
      </div>
    </DragDropProvider>
  )
}
