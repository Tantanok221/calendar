import type { GoogleCalendarConfig } from './types'

export const GOOGLE_CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar'] as const
export const GOOGLE_CALENDAR_CALLBACK_PATH = '/oauth/google/callback'

interface EnvShape extends Record<string, string | undefined> {
  GOOGLE_CALENDAR_CLIENT_ID?: string
  GOOGLE_CALENDAR_CLIENT_SECRET?: string
}

export function readGoogleCalendarConfig(env: EnvShape): GoogleCalendarConfig | null {
  const clientId = env.GOOGLE_CALENDAR_CLIENT_ID?.trim()
  const clientSecret = env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim()

  if (!clientId) {
    return null
  }

  return {
    clientId,
    clientSecret: clientSecret || null,
    authBaseUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
    redirectHost: '127.0.0.1',
    scopes: GOOGLE_CALENDAR_SCOPES
  }
}
