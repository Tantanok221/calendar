import { describe, expect, test } from 'bun:test'
import { GOOGLE_CALENDAR_SCOPES, readGoogleCalendarConfig } from './config'

describe('readGoogleCalendarConfig', () => {
  test('returns null when the client id is not configured', () => {
    expect(readGoogleCalendarConfig({})).toBeNull()
  })

  test('builds the default desktop config from environment variables', () => {
    expect(
      readGoogleCalendarConfig({
        GOOGLE_CALENDAR_CLIENT_ID: 'desktop-client-id.apps.googleusercontent.com'
      })
    ).toEqual({
      clientId: 'desktop-client-id.apps.googleusercontent.com',
      clientSecret: null,
      authBaseUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
      redirectHost: '127.0.0.1',
      scopes: GOOGLE_CALENDAR_SCOPES
    })
  })

  test('includes an optional client secret when configured', () => {
    expect(
      readGoogleCalendarConfig({
        GOOGLE_CALENDAR_CLIENT_ID: 'desktop-client-id.apps.googleusercontent.com',
        GOOGLE_CALENDAR_CLIENT_SECRET: 'desktop-client-secret'
      })
    ).toEqual({
      clientId: 'desktop-client-id.apps.googleusercontent.com',
      clientSecret: 'desktop-client-secret',
      authBaseUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
      redirectHost: '127.0.0.1',
      scopes: GOOGLE_CALENDAR_SCOPES
    })
  })
})
