import type {
  CreateGoogleCalendarEventInput,
  DeleteGoogleCalendarEventInput,
  GoogleCalendarConnectionStatus,
  GoogleCalendarEvent,
  GoogleCalendarSummary,
  ListGoogleCalendarEventsInput,
  MoveGoogleCalendarEventInput,
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
    moveEvent: (input: MoveGoogleCalendarEventInput) => Promise<GoogleCalendarEvent>
    deleteEvent: (input: DeleteGoogleCalendarEventInput) => Promise<void>
    createEvent: (input: CreateGoogleCalendarEventInput) => Promise<GoogleCalendarEvent>
  }
}
