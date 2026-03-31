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
  color: 'green'
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
