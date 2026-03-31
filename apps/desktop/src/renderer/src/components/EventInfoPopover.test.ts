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
      React.createElement(EventInfoPopover, {
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
      React.createElement(EventInfoPopover, {
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

  test('shows repeat information for recurring events', () => {
    const html = renderToStaticMarkup(
      React.createElement(EventInfoPopover, {
        event: {
          ...EVENT,
          source: {
            ...EVENT.source!,
            recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=TU,WE;COUNT=6']
          }
        },
        anchor: { top: 100, left: 140 },
        calendars: CALENDARS,
        editable: false,
        onEdit: () => {},
        onDelete: () => {},
        onClose: () => {}
      })
    )

    expect(html).toContain('Repeats every Tue, Wed')
    expect(html).toContain('6 times')
  })

  test('shows a repeat indicator for recurring instances even without recurrence details', () => {
    const html = renderToStaticMarkup(
      React.createElement(EventInfoPopover, {
        event: {
          ...EVENT,
          source: {
            ...EVENT.source!,
            eventId: 'series-1',
            recurringEventId: 'series-1'
          }
        },
        anchor: { top: 100, left: 140 },
        calendars: CALENDARS,
        editable: false,
        onEdit: () => {},
        onDelete: () => {},
        onClose: () => {}
      })
    )

    expect(html).toContain('Repeats')
  })
})
