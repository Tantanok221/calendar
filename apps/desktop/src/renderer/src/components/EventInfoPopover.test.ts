import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'bun:test'
import EventInfoPopover from './EventInfoPopover'
import type { CalendarEvent } from '../data/events'
import type { RendererCalendar } from '../lib/googleCalendarSync'

const EVENT: CalendarEvent = {
  id: 'google:readonly:evt-1',
  title: 'Leadership Sync',
  date: '2026-03-31',
  startTime: '11:00',
  endTime: '12:00',
  allDay: false,
  color: 'blue',
  calendar: 'Leadership',
  source: {
    provider: 'google',
    calendarId: 'readonly',
    eventId: 'evt-1',
    timeZone: 'Asia/Kuala_Lumpur'
  }
}

const CALENDARS: RendererCalendar[] = [
  { id: 'readonly', name: 'Leadership', color: 'blue', group: 'other' }
]

describe('EventInfoPopover', () => {
  test('omits edit and delete actions for read-only events', () => {
    const html = renderToStaticMarkup(
      React.createElement(EventInfoPopover as any, {
        event: EVENT,
        anchor: { top: 100, left: 140 },
        calendars: CALENDARS,
        editable: false,
        onEdit: () => {},
        onDelete: () => {},
        onClose: () => {}
      })
    )

    expect(html).not.toContain('Edit event')
    expect(html).not.toContain('Delete event')
  })

  test('keeps edit action visible for editable events', () => {
    const html = renderToStaticMarkup(
      React.createElement(EventInfoPopover as any, {
        event: { ...EVENT, id: 'google:primary:evt-2', calendar: 'Work' },
        anchor: { top: 100, left: 140 },
        calendars: [{ id: 'primary', name: 'Work', color: 'violet', group: 'my' }],
        editable: true,
        onEdit: () => {},
        onDelete: () => {},
        onClose: () => {}
      })
    )

    expect(html).toContain('Edit event')
  })
})
