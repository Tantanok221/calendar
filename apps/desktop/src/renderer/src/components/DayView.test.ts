import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'bun:test'
import DayView from './DayView'

function renderDayViewWithPinnedSelection(): string {
  return renderToStaticMarkup(
    React.createElement(DayView, {
      events: [],
      calendars: [],
      currentDate: new Date('2026-03-31'),
      today: new Date('2026-03-31'),
      onEventChange: () => {},
      onEventDelete: () => {},
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
})
