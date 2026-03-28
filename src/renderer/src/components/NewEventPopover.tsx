import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Popover from '@radix-ui/react-popover'
import { X, CalendarBlank, Clock, CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { cn } from '../lib/utils'
import { getClosestTimeSuggestion, getTimeSuggestions } from '../lib/timeSuggestions'
import { CALENDARS, EVENT_COLORS, isSameDay } from '../data/events'
import type { EventColor, CalendarName } from '../data/events'

// ── TimeInput ───────────────────────────────────────────────────────────────
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
              setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1))
              return
            }

            if (e.key === 'ArrowUp' && suggestions.length > 0) {
              e.preventDefault()
              setOpen(true)
              setActiveIndex((current) => Math.max(current - 1, 0))
              return
            }

            if (e.key === 'Enter' && suggestions.length > 0) {
              e.preventDefault()
              onChange(
                suggestions[activeIndex] ?? suggestions[defaultActiveIndex] ?? suggestions[0]
              )
              setOpen(false)
            }
          }}
          className="w-20 text-xs px-2 py-1 rounded-md outline-none text-center transition-colors"
          style={{
            background: open ? 'var(--surface-3)' : 'var(--surface-3)',
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
                className={cn(
                  'w-full text-left px-3 py-1.5 text-xs transition-colors',
                  isActive ? 'font-semibold' : 'font-normal'
                )}
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
            <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-dim)' }}>
              No match
            </p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// ── DatePicker ──────────────────────────────────────────────────────────────
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

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

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

interface DatePickerProps {
  value: Date
  onChange: (d: Date) => void
}

function DatePicker({ value, onChange }: DatePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(value.getFullYear())
  const [viewMonth, setViewMonth] = useState(value.getMonth())
  const today = new Date(2026, 2, 28)

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
          {/* Month navigation */}
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
            <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              {monthLabel}
            </span>
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

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DOW.map((d, i) => (
              <div key={i} className="flex items-center justify-center h-6">
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>
                  {d}
                </span>
              </div>
            ))}
          </div>

          {/* Day grid */}
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
                    background: isSelected
                      ? 'var(--accent)'
                      : isToday
                        ? 'var(--accent-bg)'
                        : 'transparent',
                    color: isSelected
                      ? 'var(--accent-on)'
                      : isToday
                        ? 'var(--accent-text)'
                        : 'var(--text)',
                    fontWeight: isSelected || isToday ? 600 : 400
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected
                      ? 'var(--accent)'
                      : isToday
                        ? 'var(--accent-bg)'
                        : 'transparent'
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Quick shortcuts */}
          <div className="flex items-center gap-1.5 mt-3">
            {[
              { label: 'Today', date: new Date(2026, 2, 28) },
              { label: 'Tomorrow', date: new Date(2026, 2, 29) },
              { label: 'Next Mon', date: new Date(2026, 2, 30) }
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

// ── Color swatch ────────────────────────────────────────────────────────────
const COLORS: EventColor[] = ['violet', 'red', 'green', 'orange', 'blue']

// ── Main component ──────────────────────────────────────────────────────────
interface NewEventPopoverProps {
  open: boolean
  onClose: () => void
}

export default function NewEventPopover({
  open,
  onClose
}: NewEventPopoverProps): React.JSX.Element {
  const [title, setTitle] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 28))
  const [allDay, setAllDay] = useState(false)
  const [startTime, setStartTime] = useState('10:00 AM')
  const [endTime, setEndTime] = useState('11:00 AM')
  const [calendar, setCalendar] = useState<CalendarName>('Work')
  const [color, setColor] = useState<EventColor>('violet')

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          data-radix-dialog-overlay
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        />

        {/* Content */}
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
            boxShadow: '0 32px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3)'
          }}
          onPointerDownOutside={onClose}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <Dialog.Title
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              New Event
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
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
                <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                  →
                </span>
                <TimeInput value={endTime} onChange={setEndTime} />
              </div>
            </div>
          )}

          {/* ── All-day toggle ── */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <button
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

          {/* ── Calendar selector ── */}
          <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
            <p
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: 'var(--text-dim)' }}
            >
              Calendar
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CALENDARS.map((cal) => {
                const active = calendar === cal.name
                return (
                  <button
                    key={cal.name}
                    onClick={() => setCalendar(cal.name)}
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
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: EVENT_COLORS[cal.color].dot }}
                    />
                    {cal.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Color picker ── */}
          <div className="px-4 pb-3 flex flex-col gap-2">
            <p
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: 'var(--text-dim)' }}
            >
              Color
            </p>
            <div className="flex items-center gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="rounded-full transition-all duration-150 shrink-0"
                  style={{
                    width: color === c ? 20 : 16,
                    height: color === c ? 20 : 16,
                    background: EVENT_COLORS[c].dot,
                    boxShadow:
                      color === c
                        ? `0 0 0 2px var(--surface-2), 0 0 0 3.5px ${EVENT_COLORS[c].dot}`
                        : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-2 px-4 py-3">
            <button
              onClick={onClose}
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
              className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-100"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            >
              Create Event
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
