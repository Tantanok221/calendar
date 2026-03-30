export interface GoogleCalendarConfig {
  clientId: string
  clientSecret: string | null
  authBaseUrl: string
  tokenUrl: string
  apiBaseUrl: string
  redirectHost: string
  scopes: readonly string[]
}

export interface GoogleTokenSet {
  accessToken: string
  refreshToken: string | null
  scope: string
  tokenType: string
  expiryDate: number | null
}

export interface StoredGoogleTokens {
  version: 1
  mode: 'encrypted' | 'plain'
  payload: string
}

export interface GoogleCalendarConnectionStatus {
  configured: boolean
  connected: boolean
  hasRefreshToken: boolean
}

export interface GoogleCalendarSummary {
  id: string
  summary: string
  description: string | null
  primary: boolean
  backgroundColor: string | null
  foregroundColor: string | null
  timeZone: string | null
}

export interface GoogleCalendarEventDateTime {
  dateTime: string | null
  date: string | null
  timeZone: string | null
}

export interface GoogleCalendarEvent {
  id: string
  calendarId: string
  status: string
  title: string
  description?: string | null
  location?: string | null
  htmlLink: string | null
  allDay: boolean
  start: GoogleCalendarEventDateTime
  end: GoogleCalendarEventDateTime
}

export interface UpdateGoogleCalendarEventInput {
  calendarId: string
  eventId: string
  start: GoogleCalendarEventDateTime
  end: GoogleCalendarEventDateTime
}

export interface CreateGoogleCalendarEventInput {
  calendarId: string
  summary: string
  start: GoogleCalendarEventDateTime
  end: GoogleCalendarEventDateTime
  recurrence?: string[]
}

export interface ListGoogleCalendarEventsInput {
  calendarId?: string
  timeMin?: string
  timeMax?: string
  maxResults?: number
  singleEvents?: boolean
  pageToken?: string
}

export interface RawGoogleCalendarListEntry {
  id: string
  summary?: string
  description?: string
  primary?: boolean
  backgroundColor?: string
  foregroundColor?: string
  timeZone?: string
}

export interface RawGoogleCalendarEvent {
  id: string
  status?: string
  summary?: string
  description?: string
  location?: string
  htmlLink?: string
  start?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
}
