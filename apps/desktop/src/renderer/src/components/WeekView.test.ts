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
      onTimedSelectionCreate: () => {}
    })
  )
}

describe('WeekView', () => {
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

  test('renders each week column at the full timed-grid height', () => {
    const html = renderWeekView([])
    const dayColumnMatches = html.match(/class=\"day-col-inner\" style=\"[^\"]*height:1536px/g)

    expect(dayColumnMatches).toHaveLength(7)
  })
})
