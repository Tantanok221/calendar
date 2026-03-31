import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Popover from '@radix-ui/react-popover'
import {
  X,
  CalendarBlank,
  Clock,
  CaretDown,
  CaretLeft,
  CaretRight,
  Repeat,
  Trash,
  Warning
} from '@phosphor-icons/react'
import { cn } from '../lib/utils'
import { getClosestTimeSuggestion, getTimeSuggestions } from '../lib/timeSuggestions'
import { EVENT_COLORS, isSameDay } from '../data/events'
import type { CalendarEvent } from '../data/events'
import type { PopoverAnchor } from '../lib/eventPopoverAnchor'
import type { RepeatEndType } from '../lib/googleCalendarCreate'
import type { RendererCalendar } from '../lib/googleCalendarSync'
import {
  getDefaultWritableCalendarId,
  getWritableCalendars
} from '../lib/calendarPermissions'
import { buildUpdatedEventFromDetailDraft } from '../lib/eventDetailDraft'
import { shouldSubmitOnEnterKeyDown } from '../lib/keyboardSubmit'
import { addDays, addMonths, getNextMonday, useToday } from '../lib/today'

interface Props {
  event: CalendarEvent
  anchor: PopoverAnchor
  calendars: RendererCalendar[]
  onSave: (event: CalendarEvent) => Promise<void> | void
  onDelete: (event: CalendarEvent) => Promise<void> | void
  onClose: () => void
}

// ── helpers ──────────────────────────────────────────────────────────────────
function to12h(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ap}`
}

function parseDateStr(s: string): Date {
  const [y, mo, d] = s.split('-').map(Number)
  return new Date(y, mo - 1, d)
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// ── TimeInput ─────────────────────────────────────────────────────────────────
interface TimeInputProps {
  value: string
  onChange: (v: string) => void
}

function TimeInput({ value, onChange }: TimeInputProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = getTimeSuggestions(value, undefined, 5)
  const closestSuggestion = getClosestTimeSuggestion(value)
  const defaultActiveIndex = Math.max(
    0,
    closestSuggestion ? suggestions.indexOf(closestSuggestion) : suggestions.indexOf(value)
  )

  useEffect(() => {
    setActiveIndex(defaultActiveIndex)
  }, [defaultActiveIndex])

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <input
          type="text"
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setActiveIndex(defaultActiveIndex)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              inputRef.current?.blur()
              return
            }
            if (e.key === 'ArrowDown' && suggestions.length > 0) {
              e.preventDefault()
              setOpen(true)
              setActiveIndex((c) => Math.min(c + 1, suggestions.length - 1))
              return
            }
            if (e.key === 'ArrowUp' && suggestions.length > 0) {
              e.preventDefault()
              setOpen(true)
              setActiveIndex((c) => Math.max(c - 1, 0))
              return
            }
            if (e.key === 'Enter' && suggestions.length > 0) {
              e.preventDefault()
              onChange(suggestions[activeIndex] ?? suggestions[defaultActiveIndex] ?? suggestions[0])
              setOpen(false)
            }
          }}
          className="w-20 text-xs px-2 py-1 rounded-md outline-none text-center transition-colors"
          style={{
            background: 'var(--surface-3)',
            border: `1px solid ${open ? 'var(--border-strong)' : 'var(--border)'}`,
            color: 'var(--text)'
          }}
        />
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-[60] overflow-y-auto rounded-lg py-1 outline-none"
          style={{
            background: 'var(--surface-3)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            maxHeight: 200,
            width: 110,
            scrollbarWidth: 'none'
          }}
        >
          {suggestions.map((t, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={t}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(t)
                  setOpen(false)
                }}
                className={cn('w-full text-left px-3 py-1.5 text-xs transition-colors', isActive ? 'font-semibold' : 'font-normal')}
                style={{
                  color: isActive ? 'var(--accent-text)' : 'var(--text)',
                  background: isActive ? 'var(--accent-bg)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  setActiveIndex(index)
                  if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                {t}
              </button>
            )
          })}
          {suggestions.length === 0 && (
            <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-dim)' }}>No match</p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// ── DatePicker ────────────────────────────────────────────────────────────────
const DOW_HEADER = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function getMiniGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

interface DatePickerProps {
  value: Date
  onChange: (d: Date) => void
}

function DatePicker({ value, onChange }: DatePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(value.getFullYear())
  const [viewMonth, setViewMonth] = useState(value.getMonth())
  const today = useToday()

  const cells = getMiniGrid(viewYear, viewMonth)
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  const navMonth = (dir: 1 | -1): void => {
    const d = new Date(viewYear, viewMonth + dir, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="flex items-center gap-1.5 text-xs rounded-md px-2 py-1 transition-all"
          style={{
            color: 'var(--text)',
            background: open ? 'var(--surface-3)' : 'transparent',
            border: `1px solid ${open ? 'var(--border-strong)' : 'transparent'}`
          }}
          onMouseEnter={(e) => {
            if (!open) e.currentTarget.style.background = 'var(--surface-3)'
          }}
          onMouseLeave={(e) => {
            if (!open) e.currentTarget.style.background = 'transparent'
          }}
        >
          {formatDateLabel(value)}
          <CaretDown size={10} weight="bold" style={{ color: 'var(--text-dim)' }} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-[60] outline-none rounded-xl p-3"
          style={{
            background: 'var(--surface-3)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
            width: 240
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navMonth(-1)}
              className="flex items-center justify-center w-6 h-6 rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)'
                e.currentTarget.style.color = 'var(--text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <CaretLeft size={11} weight="bold" />
            </button>
            <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{monthLabel}</span>
            <button
              onClick={() => navMonth(1)}
              className="flex items-center justify-center w-6 h-6 rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)'
                e.currentTarget.style.color = 'var(--text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <CaretRight size={11} weight="bold" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DOW_HEADER.map((d, i) => (
              <div key={i} className="flex items-center justify-center h-6">
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>{d}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="h-7" />
              const date = new Date(viewYear, viewMonth, day)
              const isSelected = isSameDay(date, value)
              const isToday = isSameDay(date, today)
              return (
                <button
                  key={i}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChange(date)
                    setOpen(false)
                  }}
                  className="flex items-center justify-center h-7 w-full rounded-md text-[11px] font-medium transition-all duration-100"
                  style={{
                    background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-bg)' : 'transparent',
                    color: isSelected ? 'var(--accent-on)' : isToday ? 'var(--accent-text)' : 'var(--text)',
                    fontWeight: isSelected || isToday ? 600 : 400
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected ? 'var(--accent)' : isToday ? 'var(--accent-bg)' : 'transparent'
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1.5 mt-3">
            {[
              { label: 'Today', date: today },
              { label: 'Tomorrow', date: addDays(today, 1) },
              { label: 'Next Mon', date: getNextMonday(today) }
            ].map(({ label, date }) => (
              <button
                key={label}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(date)
                  setOpen(false)
                }}
                className="flex-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors text-center whitespace-nowrap"
                style={{ color: 'var(--text)', border: '1px solid var(--border-strong)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-2)'
                  e.currentTarget.style.borderColor = 'var(--accent-border)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'var(--border-strong)'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EventDetailPopover({
  event,
  calendars,
  onSave,
  onDelete,
  onClose
}: Props): React.JSX.Element {
  const writableCalendars = getWritableCalendars(calendars)
  const c = EVENT_COLORS[event.color]
  const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const DOW_FULL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const [title, setTitle] = useState(event.title)
  const [selectedDate, setSelectedDate] = useState(() => parseDateStr(event.date))
  const [allDay, setAllDay] = useState(event.allDay ?? false)
  const [startTime, setStartTime] = useState(event.startTime ? to12h(event.startTime) : '10:00 AM')
  const [endTime, setEndTime] = useState(event.endTime ? to12h(event.endTime) : '11:00 AM')
  const [calendarId, setCalendarId] = useState(() =>
    getDefaultWritableCalendarId(
      calendars,
      event.source?.calendarId ?? calendars.find((calendar) => calendar.name === event.calendar)?.id
    )
  )
  const [repeat, setRepeat] = useState(false)
  const [repeatDays, setRepeatDays] = useState<number[]>([])
  const [repeatEndType, setRepeatEndType] = useState<RepeatEndType>('date')
  const [repeatUntil, setRepeatUntil] = useState(() => addMonths(parseDateStr(event.date), 1))
  const [repeatCount, setRepeatCount] = useState(4)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const selectedCalendar =
    writableCalendars.find((calendar) => calendar.id === calendarId) ?? writableCalendars[0]
  const isBusy = isSaving || isDeleting

  useEffect(() => {
    const nextCalendarId = getDefaultWritableCalendarId(calendars, calendarId)

    if (nextCalendarId !== calendarId) {
      setCalendarId(nextCalendarId)
    }
  }, [calendarId, calendars])

  const toggleRepeatDay = (idx: number): void => {
    setRepeatDays((prev) => prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx])
  }

  const handleSave = async (): Promise<void> => {
    if (!selectedCalendar) {
      return
    }

    setIsSaving(true)
    setSubmitError(null)

    try {
      await onSave(
        buildUpdatedEventFromDetailDraft(event, {
          title,
          selectedDate,
          allDay,
          startTime,
          endTime,
          calendarId: selectedCalendar.id,
          calendarName: selectedCalendar.name,
          color: selectedCalendar.color
        })
      )
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save event')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true)
    setSubmitError(null)

    try {
      await onDelete(event)
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete event')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(v) => {
        if (!v && !isBusy) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          data-radix-dialog-overlay
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        />

        <Dialog.Content
          data-radix-dialog-content
          className="fixed z-50 flex flex-col outline-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 340,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 14,
            boxShadow: '0 32px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}
          onClick={(event) => {
            event.stopPropagation()
          }}
          onPointerDown={(event) => {
            event.stopPropagation()
          }}
          onPointerDownOutside={(event) => {
            if (isBusy) {
              event.preventDefault()
              return
            }

            onClose()
          }}
          onKeyDown={(event) => {
            const target = event.target instanceof HTMLElement ? event.target : null

            if (
              confirmDelete ||
              !shouldSubmitOnEnterKeyDown({
                key: event.key,
                tagName: target?.tagName,
                defaultPrevented: event.defaultPrevented,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey,
                isContentEditable: target?.isContentEditable
              })
            ) {
              return
            }

            event.preventDefault()
            void handleSave()
          }}
        >
          {/* color accent bar */}
          <div style={{ height: 3, background: c.dot, flexShrink: 0 }} />

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <Dialog.Title
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Edit Event
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                disabled={isBusy}
                className="flex items-center justify-center w-6 h-6 rounded-md transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-3)'
                  e.currentTarget.style.color = 'var(--text)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                <X size={13} weight="bold" />
              </button>
            </Dialog.Close>
          </div>

          {/* ── Title input ── */}
          <div className="px-4 pb-3">
            <input
              autoFocus
              disabled={isBusy}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              onKeyDown={(e) => e.key === 'Escape' && onClose()}
              className="w-full bg-transparent text-[15px] font-semibold outline-none"
              style={{ color: 'var(--text)' }}
            />
          </div>

          <div className="mx-4" style={{ height: 1, background: 'var(--border)' }} />

          {/* ── Date row ── */}
          <div className="flex items-center gap-3 px-4 py-2">
            <CalendarBlank size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
          </div>

          {/* ── Time row ── */}
          {!allDay && (
            <div className="flex items-center gap-2 px-4 pb-2.5">
              <Clock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <div className="flex items-center gap-2">
                <TimeInput value={startTime} onChange={setStartTime} />
                <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>→</span>
                <TimeInput value={endTime} onChange={setEndTime} />
              </div>
            </div>
          )}

          {/* ── All-day toggle ── */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <button
              disabled={isBusy}
              onClick={() => setAllDay(!allDay)}
              className="flex items-center gap-2 text-xs transition-colors select-none"
              style={{ color: allDay ? 'var(--accent-text)' : 'var(--text-muted)' }}
            >
              <span
                className="flex items-center w-7 h-4 rounded-full transition-colors duration-200 relative shrink-0"
                style={{ background: allDay ? 'var(--accent)' : 'var(--surface-3)' }}
              >
                <span
                  className="absolute w-3 h-3 rounded-full transition-all duration-200"
                  style={{
                    background: allDay ? 'var(--accent-on)' : 'var(--text-dim)',
                    left: allDay ? '14px' : '2px'
                  }}
                />
              </span>
              All day
            </button>
          </div>

          <div className="mx-4" style={{ height: 1, background: 'var(--border)' }} />

          {/* ── Repeat toggle ── */}
          <div className="flex items-center gap-2 px-4 py-3">
            <Repeat size={14} style={{ color: repeat ? 'var(--accent-text)' : 'var(--text-muted)', flexShrink: 0 }} />
            <button
              disabled={isBusy}
              onClick={() => setRepeat(!repeat)}
              className="flex items-center gap-2 text-xs transition-colors select-none"
              style={{ color: repeat ? 'var(--accent-text)' : 'var(--text-muted)' }}
            >
              <span
                className="flex items-center w-7 h-4 rounded-full transition-colors duration-200 relative shrink-0"
                style={{ background: repeat ? 'var(--accent)' : 'var(--surface-3)' }}
              >
                <span
                  className="absolute w-3 h-3 rounded-full transition-all duration-200"
                  style={{
                    background: repeat ? 'var(--accent-on)' : 'var(--text-dim)',
                    left: repeat ? '14px' : '2px'
                  }}
                />
              </span>
              Repeat
            </button>
          </div>

          {/* ── Repeat options ── */}
          {repeat && (
            <div
              className="mx-4 mb-3 rounded-lg flex flex-col gap-3 p-3"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-dim)' }}>
                  Repeats on
                </p>
                <div className="flex items-center gap-1">
                  {DOW_LABELS.map((label, idx) => {
                    const active = repeatDays.includes(idx)
                    return (
                      <button
                        key={idx}
                        title={DOW_FULL[idx]}
                        disabled={isBusy}
                        onClick={() => toggleRepeatDay(idx)}
                        className="flex items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-100"
                        style={{
                          width: 28,
                          height: 28,
                          background: active ? 'var(--accent)' : 'var(--surface-2)',
                          color: active ? 'var(--accent-on)' : 'var(--text-muted)',
                          border: `1px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.borderColor = 'var(--accent-border)'
                            e.currentTarget.style.color = 'var(--accent-text)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.borderColor = 'var(--border-strong)'
                            e.currentTarget.style.color = 'var(--text-muted)'
                          }
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-dim)' }}>
                  Ends
                </p>
                <div
                  className="flex items-center rounded-md overflow-hidden"
                  style={{ border: '1px solid var(--border-strong)', width: 'fit-content' }}
                >
                  {(['date', 'count'] as RepeatEndType[]).map((type) => {
                    const active = repeatEndType === type
                    return (
                      <button
                        key={type}
                        disabled={isBusy}
                        onClick={() => setRepeatEndType(type)}
                        className="px-3 py-1 text-[11px] font-medium transition-colors"
                        style={{
                          background: active ? 'var(--accent)' : 'transparent',
                          color: active ? 'var(--accent-on)' : 'var(--text-muted)'
                        }}
                        onMouseEnter={(e) => {
                          if (!active) e.currentTarget.style.background = 'var(--surface-2)'
                        }}
                        onMouseLeave={(e) => {
                          if (!active) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        {type === 'date' ? 'On date' : 'After'}
                      </button>
                    )
                  })}
                </div>

                {repeatEndType === 'date' ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Until</span>
                    <DatePicker value={repeatUntil} onChange={setRepeatUntil} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={999}
                      disabled={isBusy}
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 text-xs px-2 py-1 rounded-md outline-none text-center"
                      style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text)'
                      }}
                    />
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {repeatCount === 1 ? 'occurrence' : 'occurrences'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mx-4" style={{ height: 1, background: 'var(--border)' }} />

          {/* ── Calendar selector ── */}
          <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-dim)' }}>
              Calendar
            </p>
            {writableCalendars.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {writableCalendars.map((cal) => {
                    const active = calendarId === cal.id
                    const calColors = EVENT_COLORS[cal.color]
                    return (
                      <button
                        key={cal.id}
                        disabled={isBusy}
                        onClick={() => setCalendarId(cal.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-100"
                        style={{
                          background: active ? 'var(--surface-3)' : 'transparent',
                          border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
                          color: active ? 'var(--text)' : 'var(--text-muted)'
                        }}
                        onMouseEnter={(e) => {
                          if (!active) e.currentTarget.style.borderColor = 'var(--border-strong)'
                        }}
                        onMouseLeave={(e) => {
                          if (!active) e.currentTarget.style.borderColor = 'var(--border)'
                        }}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: calColors.dot }} />
                        {cal.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No editable calendars available.
              </p>
            )}
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* ── Footer ── */}
          <div className="px-4 py-3">
            {submitError && (
              <p className="mb-2 text-[11px]" style={{ color: '#C98A76' }}>
                {submitError}
              </p>
            )}

            <div className="flex items-center justify-between">
            {/* Delete side */}
              {confirmDelete ? (
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Warning size={13} style={{ color: '#C98A76' }} />
                    <span className="text-[11px]" style={{ color: '#C98A76' }}>Delete this event?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={isBusy}
                      className="px-2 py-1 rounded-md text-[11px] font-medium transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-3)'
                        e.currentTarget.style.color = 'var(--text)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-muted)'
                      }}
                    >
                      No
                    </button>
                    <button
                      onClick={() => void handleDelete()}
                      disabled={isBusy}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold transition-all"
                      style={{ background: 'rgba(192,120,96,0.15)', color: '#C98A76', border: '1px solid rgba(192,120,96,0.35)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-100"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(192,120,96,0.10)'
                    e.currentTarget.style.color = '#C98A76'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }}
                >
                  <Trash size={13} />
                  Delete
                </button>
              )}

              {/* Save side */}
              {!confirmDelete && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    disabled={isBusy}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-3)'
                      e.currentTarget.style.color = 'var(--text)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleSave()}
                    disabled={isBusy || !selectedCalendar}
                    className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-100"
                    style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                  >
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
