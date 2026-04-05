import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'bun:test'
import DayView from './DayView'

function renderDayView(events: React.ComponentProps<typeof DayView>['events']): string {
  return renderToStaticMarkup(
    React.createElement(DayView, {
      events,
      calendars: [],
      currentDate: new Date('2026-03-31'),
      today: new Date('2026-03-31'),
      onEventChange: () => {},
      onEventDelete: () => {},
      onAllDayCreate: () => {},
      onTimedSelectionCreate: () => {}
    })
  )
}

function renderDayViewWithPinnedSelection(): string {
  return renderToStaticMarkup(
    React.createElement(DayView, {
      events: [],
      calendars: [],
      currentDate: new Date('2026-03-31'),
      today: new Date('2026-03-31'),
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
}

describe('DayView', () => {
  test('renders resize handles for the pinned new-event preview', () => {
    const html = renderDayViewWithPinnedSelection()

    expect(html).toContain('new-event-selection-resize-handle-top')
    expect(html).toContain('new-event-selection-resize-handle-bottom')
  })

  test('renders the all-day strip in the empty state without helper copy', () => {
    const html = renderDayView([])

    expect(html).toContain('All day')
    expect(html).toContain('aria-label="Create all-day event"')
    expect(html).not.toContain('>Create all-day event<')
  })

  test('renders a white all-day preview box when the new event draft is all day', () => {
    const html = renderToStaticMarkup(
      React.createElement(DayView, {
        events: [],
        calendars: [],
        currentDate: new Date('2026-03-31'),
        today: new Date('2026-03-31'),
        onEventChange: () => {},
        onEventDelete: () => {},
        onAllDayCreate: () => {},
        onTimedSelectionCreate: () => {},
        newEventOpen: true,
        allDayPreviewDate: new Date('2026-03-31')
      })
    )

    expect(html).toContain('new-event-all-day-preview')
    expect(html).toContain('background:rgba(215,206,178,0.20)')
    expect(html).toContain('box-shadow:inset 0 0 0 1px rgba(215,206,178,0.12)')
  })

  test('renders the all-day preview after existing all-day events', () => {
    const html = renderToStaticMarkup(
      React.createElement(DayView, {
        events: [
          {
            id: 'all-day-1',
            title: 'Release day',
            date: '2026-03-31',
            allDay: true,
            color: 'blue',
            calendar: 'Work'
          }
        ],
        calendars: [],
        currentDate: new Date('2026-03-31'),
        today: new Date('2026-03-31'),
        onEventChange: () => {},
        onEventDelete: () => {},
        onAllDayCreate: () => {},
        onTimedSelectionCreate: () => {},
        newEventOpen: true,
        allDayPreviewDate: new Date('2026-03-31')
      })
    )

    expect(html.indexOf('Release day')).toBeLessThan(html.indexOf('new-event-all-day-preview'))
  })
})
