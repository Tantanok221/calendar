import { describe, expect, test } from 'bun:test'
import {
  getGoogleCalendarErrorMessage,
  shouldOpenGoogleCalendarLoginModal
} from './googleCalendarConnection'

describe('shouldOpenGoogleCalendarLoginModal', () => {
  test('opens when Google Calendar is configured, disconnected, and not dismissed', () => {
    expect(
      shouldOpenGoogleCalendarLoginModal(
        {
          configured: true,
          connected: false,
          hasRefreshToken: false
        },
        false
      )
    ).toBe(true)
  })

  test('stays closed once the user has dismissed it', () => {
    expect(
      shouldOpenGoogleCalendarLoginModal(
        {
          configured: true,
          connected: false,
          hasRefreshToken: false
        },
        true
      )
    ).toBe(false)
  })

  test('stays closed when Google Calendar is already connected', () => {
    expect(
      shouldOpenGoogleCalendarLoginModal(
        {
          configured: true,
          connected: true,
          hasRefreshToken: true
        },
        false
      )
    ).toBe(false)
  })

  test('stays closed when the app build is not configured for Google Calendar', () => {
    expect(
      shouldOpenGoogleCalendarLoginModal(
        {
          configured: false,
          connected: false,
          hasRefreshToken: false
        },
        false
      )
    ).toBe(false)
  })
})

describe('getGoogleCalendarErrorMessage', () => {
  test('keeps an explicit error message', () => {
    expect(getGoogleCalendarErrorMessage(new Error('OAuth window was closed'))).toBe(
      'OAuth window was closed'
    )
  })

  test('unwraps Electron IPC wrapper errors to the root Google Calendar message', () => {
    expect(
      getGoogleCalendarErrorMessage(
        new Error(
          "Error invoking remote method 'google-calendar:connect': Error: GOOGLE_CALENDAR_CLIENT_ID is not configured"
        )
      )
    ).toBe('GOOGLE_CALENDAR_CLIENT_ID is not configured')
  })

  test('falls back to a generic message for unknown failures', () => {
    expect(getGoogleCalendarErrorMessage('nope')).toBe(
      'Google Calendar sign-in failed. Please try again.'
    )
  })
})
