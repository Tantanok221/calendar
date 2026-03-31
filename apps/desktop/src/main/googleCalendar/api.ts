import { writeFile } from 'node:fs/promises'
import type {
  CreateGoogleCalendarEventInput,
  DeleteGoogleCalendarEventInput,
  GoogleCalendarEvent,
  GoogleCalendarSummary,
  ListGoogleCalendarEventsInput,
  MoveGoogleCalendarEventInput,
  RawGoogleCalendarEvent,
  RawGoogleCalendarListEntry,
  UpdateGoogleCalendarEventInput
} from './types'

interface GoogleApiRequestInput {
  accessToken: string
  apiBaseUrl: string
  fetchImpl?: typeof fetch
}

interface FetchGoogleEventsInput extends GoogleApiRequestInput, ListGoogleCalendarEventsInput {}
interface UpdateGoogleEventInput extends GoogleApiRequestInput, UpdateGoogleCalendarEventInput {}
interface CreateGoogleEventInput extends GoogleApiRequestInput, CreateGoogleCalendarEventInput {}
interface MoveGoogleEventInput extends GoogleApiRequestInput, MoveGoogleCalendarEventInput {}
interface DeleteGoogleEventInput extends GoogleApiRequestInput, DeleteGoogleCalendarEventInput {}

export async function fetchGoogleCalendars(
  input: GoogleApiRequestInput
): Promise<GoogleCalendarSummary[]> {
  const url = `${input.apiBaseUrl}/users/me/calendarList`
  const response = await (input.fetchImpl ?? fetch)(url, {
    headers: {
      Authorization: `Bearer ${input.accessToken}`
    }
  })

  const data = await parseGoogleJson<{ items?: RawGoogleCalendarListEntry[] }>(response)

  try {
    await writeFile(
      '/tmp/google-calendar-list-debug.json',
      JSON.stringify(data.items ?? [], null, 2),
      'utf8'
    )
  } catch {
    // Best-effort debug dump for live investigation.
  }

  return (data.items ?? []).map((calendar) => ({
    id: calendar.id,
    summary: calendar.summary ?? '',
    summaryOverride: calendar.summaryOverride ?? null,
    description: calendar.description ?? null,
    primary: Boolean(calendar.primary),
    backgroundColor: calendar.backgroundColor ?? null,
    foregroundColor: calendar.foregroundColor ?? null,
    timeZone: calendar.timeZone ?? null,
    accessRole: calendar.accessRole ?? null,
    dataOwner: calendar.dataOwner ?? null,
    selected: calendar.selected ?? true,
    hidden: calendar.hidden ?? false
  }))
}

export async function fetchGoogleCalendarEvents(
  input: FetchGoogleEventsInput
): Promise<GoogleCalendarEvent[]> {
  const calendarId = encodeURIComponent(input.calendarId ?? 'primary')
  const url = new URL(`${input.apiBaseUrl}/calendars/${calendarId}/events`)

  url.searchParams.set('maxResults', String(input.maxResults ?? 250))
  url.searchParams.set('singleEvents', String(input.singleEvents ?? true))

  if ((input.singleEvents ?? true) === true) {
    url.searchParams.set('orderBy', 'startTime')
  }

  if (input.timeMin) {
    url.searchParams.set('timeMin', input.timeMin)
  }

  if (input.timeMax) {
    url.searchParams.set('timeMax', input.timeMax)
  }

  if (input.pageToken) {
    url.searchParams.set('pageToken', input.pageToken)
  }

  const response = await (input.fetchImpl ?? fetch)(url, {
    headers: {
      Authorization: `Bearer ${input.accessToken}`
    }
  })

  const data = await parseGoogleJson<{ items?: RawGoogleCalendarEvent[] }>(response)

  return (data.items ?? []).map((event) =>
    normalizeGoogleCalendarEvent(input.calendarId ?? 'primary', event)
  )
}

export async function updateGoogleCalendarEvent(
  input: UpdateGoogleEventInput
): Promise<GoogleCalendarEvent> {
  const calendarId = encodeURIComponent(input.calendarId)
  const eventId = encodeURIComponent(input.eventId)
  const response = await (input.fetchImpl ?? fetch)(
    `${input.apiBaseUrl}/calendars/${calendarId}/events/${eventId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: input.summary,
        location: input.location,
        recurrence: input.recurrence,
        start: toGoogleDateTimePayload(input.start),
        end: toGoogleDateTimePayload(input.end)
      })
    }
  )

  const data = await parseGoogleJson<RawGoogleCalendarEvent>(response)

  return normalizeGoogleCalendarEvent(input.calendarId, data)
}

export async function moveGoogleCalendarEvent(
  input: MoveGoogleEventInput
): Promise<GoogleCalendarEvent> {
  const calendarId = encodeURIComponent(input.calendarId)
  const eventId = encodeURIComponent(input.eventId)
  const destinationCalendarId = encodeURIComponent(input.destinationCalendarId)
  const response = await (input.fetchImpl ?? fetch)(
    `${input.apiBaseUrl}/calendars/${calendarId}/events/${eventId}/move?destination=${destinationCalendarId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`
      }
    }
  )

  const data = await parseGoogleJson<RawGoogleCalendarEvent>(response)

  return normalizeGoogleCalendarEvent(input.destinationCalendarId, data)
}

export async function deleteGoogleCalendarEvent(input: DeleteGoogleEventInput): Promise<void> {
  const calendarId = encodeURIComponent(input.calendarId)
  const eventId = encodeURIComponent(input.eventId)
  const response = await (input.fetchImpl ?? fetch)(
    `${input.apiBaseUrl}/calendars/${calendarId}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${input.accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      `Google Calendar API request failed with status ${response.status}: ${await response.text()}`
    )
  }
}

export async function createGoogleCalendarEvent(
  input: CreateGoogleEventInput
): Promise<GoogleCalendarEvent> {
  const calendarId = encodeURIComponent(input.calendarId)
  const response = await (input.fetchImpl ?? fetch)(
    `${input.apiBaseUrl}/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: input.summary,
        ...(input.location ? { location: input.location } : {}),
        start: toGoogleDateTimePayload(input.start),
        end: toGoogleDateTimePayload(input.end),
        recurrence: input.recurrence
      })
    }
  )

  const data = await parseGoogleJson<RawGoogleCalendarEvent>(response)

  return normalizeGoogleCalendarEvent(input.calendarId, data)
}

export function normalizeGoogleCalendarEvent(
  calendarId: string,
  event: RawGoogleCalendarEvent
): GoogleCalendarEvent {
  const normalizedEvent: GoogleCalendarEvent = {
    id: event.id,
    calendarId,
    ...(event.recurringEventId ? { recurringEventId: event.recurringEventId } : {}),
    status: event.status ?? 'confirmed',
    title: event.summary ?? '',
    ...(event.recurrence ? { recurrence: event.recurrence } : {}),
    htmlLink: event.htmlLink ?? null,
    allDay: Boolean(event.start?.date && !event.start?.dateTime),
    start: {
      dateTime: event.start?.dateTime ?? null,
      date: event.start?.date ?? null,
      timeZone: event.start?.timeZone ?? null
    },
    end: {
      dateTime: event.end?.dateTime ?? null,
      date: event.end?.date ?? null,
      timeZone: event.end?.timeZone ?? null
    }
  }

  if (event.description) {
    normalizedEvent.description = event.description
  }

  if (event.location) {
    normalizedEvent.location = event.location
  }

  return normalizedEvent
}

async function parseGoogleJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(
      `Google Calendar API request failed with status ${response.status}: ${await response.text()}`
    )
  }

  return (await response.json()) as T
}

function toGoogleDateTimePayload(value: {
  dateTime: string | null
  date: string | null
  timeZone: string | null
}): Record<string, string> {
  if (value.dateTime) {
    return value.timeZone
      ? { dateTime: value.dateTime, timeZone: value.timeZone }
      : { dateTime: value.dateTime }
  }

  if (value.date) {
    return value.timeZone ? { date: value.date, timeZone: value.timeZone } : { date: value.date }
  }

  throw new Error('Google Calendar event updates require either dateTime or date values')
}
