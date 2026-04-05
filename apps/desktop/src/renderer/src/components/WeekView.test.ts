import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'bun:test'
import WeekView from './WeekView'
import type { CalendarEvent } from '../data/events'

const WEEK_GRID_TEMPLATE_COLUMNS = 'var(--time-col-w) repeat(7, minmax(0, 1fr))'

function renderWeekView(events: CalendarEvent[]): string {
  return renderToStaticMarkup(
    React.createElement(WeekView, {
      events,
      calendars: [],
      currentDate: new Date('2026-03-31'),
      today: new Date('2026-03-31'),
      onDateSelect: () => {},
      onEventChange: () => {},
      onEventDelete: () => {},
      onAllDayCreate: () => {},
      onTimedSelectionCreate: () => {}
    })
  )
}

describe('WeekView', () => {
  test('renders resize handles for the pinned new-event preview', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekView, {
        events: [],
        calendars: [],
        currentDate: new Date('2026-03-31'),
        today: new Date('2026-03-31'),
        onDateSelect: () => {},
        onEventChange: () => {},
        onEventDelete: () => {},
        onAllDayCreate: () => {},
        onTimedSelectionCreate: () => {},
        newEventOpen: true,
        pinnedSelection: {
          date: new Date('2026-03-31'),
          startMinutes: 9 * 60,
          endMinutes: 10 * 60 + 30
        },
        onPinnedSelectionChange: () => {}
      })
    )

    expect(html).toContain('new-event-selection-resize-handle-top')
    expect(html).toContain('new-event-selection-resize-handle-bottom')
  })

  test('keeps all-day and timed columns on the same shrink-safe grid and uses ALL DAY label', () => {
    const html = renderWeekView([
      {
        id: 'all-day-friday',
        title: 'Good Friday (regional holiday)',
        date: '2026-04-03',
        allDay: true,
        color: 'green',
        calendar: 'Work'
      }
    ])

    expect(html).toContain(`grid-template-columns:${WEEK_GRID_TEMPLATE_COLUMNS}`)
    expect(html.split(`grid-template-columns:${WEEK_GRID_TEMPLATE_COLUMNS}`)).toHaveLength(4)
    expect(html).toContain('ALL DAY')
  })

  test('renders an empty all-day row without helper copy', () => {
    const html = renderWeekView([])

    expect(html).toContain('ALL DAY')
    expect(html.match(/aria-label="Create all-day event"/g)).toHaveLength(7)
    expect(html).not.toContain('>Create all-day event<')
  })

  test('renders a white all-day preview box in the selected day column when the draft is all day', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekView, {
        events: [],
        calendars: [],
        currentDate: new Date('2026-03-31'),
        today: new Date('2026-03-31'),
        onDateSelect: () => {},
        onEventChange: () => {},
        onEventDelete: () => {},
        onAllDayCreate: () => {},
        onTimedSelectionCreate: () => {},
        newEventOpen: true,
        allDayPreviewDate: new Date('2026-04-01')
      })
    )

    expect(html.match(/new-event-all-day-preview/g)).toHaveLength(1)
    expect(html).toContain('background:rgba(215,206,178,0.20)')
    expect(html).toContain('box-shadow:inset 0 0 0 1px rgba(215,206,178,0.12)')
  })

  test('renders the all-day preview after existing all-day events in its column', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekView, {
        events: [
          {
            id: 'all-day-1',
            title: 'Release day',
            date: '2026-04-01',
            allDay: true,
            color: 'blue',
            calendar: 'Work'
          }
        ],
        calendars: [],
        currentDate: new Date('2026-03-31'),
        today: new Date('2026-03-31'),
        onDateSelect: () => {},
        onEventChange: () => {},
        onEventDelete: () => {},
        onAllDayCreate: () => {},
        onTimedSelectionCreate: () => {},
        newEventOpen: true,
        allDayPreviewDate: new Date('2026-04-01')
      })
    )

    expect(html.indexOf('Release day')).toBeLessThan(html.indexOf('new-event-all-day-preview'))
  })

  test('renders each week column at the full timed-grid height', () => {
    const html = renderWeekView([])
    const dayColumnMatches = html.match(/class="day-col-inner" style="[^"]*height:1536px/g)

    expect(dayColumnMatches).toHaveLength(7)
  })
})
