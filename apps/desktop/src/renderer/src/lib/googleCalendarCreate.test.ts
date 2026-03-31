import { describe, expect, test } from 'bun:test'
import {
  buildGoogleCalendarCreateInput,
  buildLocalEventsFromDraft,
  type CreateCalendarEventDraft
} from './googleCalendarCreate'

const BASE_DRAFT: CreateCalendarEventDraft = {
  title: 'Ship launch',
  location: 'Harbor Room',
  selectedDate: new Date(2026, 2, 30),
  allDay: false,
  startTime: '10:00 AM',
  endTime: '11:30 AM',
  calendarId: 'primary',
  calendarName: 'Work',
  color: 'violet',
  repeat: false,
  repeatDays: [],
  repeatEndType: 'date',
  repeatUntil: new Date(2026, 3, 30),
  repeatCount: 4
}

describe('buildGoogleCalendarCreateInput', () => {
  test('builds a timed Google event payload', () => {
    expect(buildGoogleCalendarCreateInput(BASE_DRAFT, 'Asia/Kuala_Lumpur')).toEqual({
      calendarId: 'primary',
      summary: 'Ship launch',
      location: 'Harbor Room',
      start: {
        dateTime: '2026-03-30T10:00:00.000',
        date: null,
        timeZone: 'Asia/Kuala_Lumpur'
      },
      end: {
        dateTime: '2026-03-30T11:30:00.000',
        date: null,
        timeZone: 'Asia/Kuala_Lumpur'
      },
      recurrence: undefined
    })
  })

  test('builds an all-day recurring Google event payload', () => {
    expect(
      buildGoogleCalendarCreateInput(
        {
          ...BASE_DRAFT,
          allDay: true,
          repeat: true,
          repeatDays: [0, 2],
          repeatEndType: 'count',
          repeatCount: 5
        },
        'Asia/Kuala_Lumpur'
      )
    ).toEqual({
      calendarId: 'primary',
      summary: 'Ship launch',
      location: 'Harbor Room',
      start: {
        dateTime: null,
        date: '2026-03-30',
        timeZone: null
      },
      end: {
        dateTime: null,
        date: '2026-03-31',
        timeZone: null
      },
      recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=5']
    })
  })
})

describe('buildLocalEventsFromDraft', () => {
  test('expands recurring local events for the selected weekdays', () => {
    const events = buildLocalEventsFromDraft({
      ...BASE_DRAFT,
      repeat: true,
      repeatDays: [0, 2],
      repeatEndType: 'count',
      repeatCount: 4
    })

    expect(events).toHaveLength(4)
    expect(events.map((event) => event.date)).toEqual([
      '2026-03-30',
      '2026-04-01',
      '2026-04-06',
      '2026-04-08'
    ])
    expect(events[0]).toMatchObject({
      title: 'Ship launch',
      location: 'Harbor Room',
      startTime: '10:00',
      endTime: '11:30',
      allDay: false,
      calendar: 'Work'
    })
  })
})
