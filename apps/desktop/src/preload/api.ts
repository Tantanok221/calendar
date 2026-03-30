import type {
  CreateGoogleCalendarEventInput,
  GoogleCalendarConnectionStatus,
  GoogleCalendarEvent,
  GoogleCalendarSummary,
  ListGoogleCalendarEventsInput,
  UpdateGoogleCalendarEventInput
} from '../main/googleCalendar/types'

export interface DesktopApi {
  googleCalendar: {
    getStatus: () => Promise<GoogleCalendarConnectionStatus>
    connect: () => Promise<GoogleCalendarConnectionStatus>
    disconnect: () => Promise<void>
    listCalendars: () => Promise<GoogleCalendarSummary[]>
    listEvents: (input?: ListGoogleCalendarEventsInput) => Promise<GoogleCalendarEvent[]>
    updateEvent: (input: UpdateGoogleCalendarEventInput) => Promise<GoogleCalendarEvent>
    createEvent: (input: CreateGoogleCalendarEventInput) => Promise<GoogleCalendarEvent>
  }
}
