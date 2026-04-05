import { describe, expect, test } from 'bun:test'
import { GOOGLE_CALENDAR_SCOPES, readGoogleCalendarConfig } from './config'

describe('readGoogleCalendarConfig', () => {
  test('returns null when the bundled client id is not configured', () => {
    expect(readGoogleCalendarConfig({ clientId: null, clientSecret: null })).toBeNull()
  })

  test('builds the default desktop config from bundled values', () => {
    expect(
      readGoogleCalendarConfig({
        clientId: 'desktop-client-id.apps.googleusercontent.com',
        clientSecret: null
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

  test('includes an optional bundled client secret when configured', () => {
    expect(
      readGoogleCalendarConfig({
        clientId: 'desktop-client-id.apps.googleusercontent.com',
        clientSecret: 'desktop-client-secret'
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
