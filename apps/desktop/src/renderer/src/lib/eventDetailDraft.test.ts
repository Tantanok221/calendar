import { describe, expect, test } from 'bun:test'
import { buildUpdatedEventFromDetailDraft, type EventDetailDraft } from './eventDetailDraft'

const BASE_DRAFT: EventDetailDraft = {
  title: 'Rescheduled standup',
  location: 'Boardroom 2',
  selectedDate: new Date(2026, 3, 1),
  allDay: false,
  startTime: '1:00 PM',
  endTime: '2:00 PM',
  calendarId: 'team',
  calendarName: 'Team',
  color: 'green',
  repeatChanged: false,
  repeat: false,
  repeatDays: [],
  repeatEndType: 'date',
  repeatUntil: new Date(2026, 4, 1),
  repeatCount: 4
}

describe('buildUpdatedEventFromDetailDraft', () => {
  test('applies popover edits to timed Google-backed events', () => {
    expect(
      buildUpdatedEventFromDetailDraft(
        {
          id: 'google:primary:evt-1',
          title: 'Standup',
          location: 'Boardroom 1',
          date: '2026-03-30',
          startTime: '09:00',
          endTime: '09:30',
          allDay: false,
          color: 'violet',
          calendar: 'Work',
          source: {
            provider: 'google',
            calendarId: 'primary',
            eventId: 'evt-1',
            timeZone: 'Asia/Kuala_Lumpur'
          }
        },
        BASE_DRAFT
      )
    ).toEqual({
      id: 'google:primary:evt-1',
      title: 'Rescheduled standup',
      location: 'Boardroom 2',
      date: '2026-04-01',
      startTime: '13:00',
      endTime: '14:00',
      allDay: false,
      color: 'green',
      calendar: 'Team',
      source: {
        provider: 'google',
        calendarId: 'team',
        eventId: 'evt-1',
        timeZone: 'Asia/Kuala_Lumpur'
      }
    })
  })

  test('stores Google recurrence changes on the updated event source', () => {
    expect(
      buildUpdatedEventFromDetailDraft(
        {
          id: 'google:primary:series-1',
          title: 'Standup',
          date: '2026-03-30',
          startTime: '09:00',
          endTime: '09:30',
          allDay: false,
          color: 'violet',
          calendar: 'Work',
          source: {
            provider: 'google',
            calendarId: 'primary',
            eventId: 'series-1',
            recurringEventId: 'series-1',
            timeZone: 'Asia/Kuala_Lumpur'
          }
        },
        {
          ...BASE_DRAFT,
          repeatChanged: true,
          repeat: true,
          repeatDays: [1, 2],
          repeatEndType: 'count',
          repeatCount: 6
        }
      )
    ).toEqual({
      id: 'google:primary:series-1',
      title: 'Rescheduled standup',
      location: 'Boardroom 2',
      date: '2026-04-01',
      startTime: '13:00',
      endTime: '14:00',
      allDay: false,
      color: 'green',
      calendar: 'Team',
      source: {
        provider: 'google',
        calendarId: 'team',
        eventId: 'series-1',
        recurringEventId: 'series-1',
        timeZone: 'Asia/Kuala_Lumpur',
        recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=TU,WE;COUNT=6'],
        recurrenceDirty: true
      }
    })
  })

  test('builds all-day events without times', () => {
    expect(
      buildUpdatedEventFromDetailDraft(
        {
          id: 'local:1',
          title: 'Offsite',
          location: 'Old office',
          date: '2026-03-30',
          startTime: '10:00',
          endTime: '11:00',
          allDay: false,
          color: 'violet',
          calendar: 'Work'
        },
        {
          ...BASE_DRAFT,
          allDay: true
        }
      )
    ).toEqual({
      id: 'local:1',
      title: 'Rescheduled standup',
      location: 'Boardroom 2',
      date: '2026-04-01',
      startTime: undefined,
      endTime: undefined,
      allDay: true,
      color: 'green',
      calendar: 'Team'
    })
  })

  test('rejects invalid timed ranges', () => {
    expect(() =>
      buildUpdatedEventFromDetailDraft(
        {
          id: 'local:1',
          title: 'Standup',
          date: '2026-03-30',
          startTime: '09:00',
          endTime: '09:30',
          allDay: false,
          color: 'violet',
          calendar: 'Work'
        },
        {
          ...BASE_DRAFT,
          startTime: '3:00 PM',
          endTime: '2:00 PM'
        }
      )
    ).toThrow('End time must be after the start time')
  })
})
