import type { GoogleCalendarConnectionStatus } from '../../../main/googleCalendar/types'

export function shouldOpenGoogleCalendarLoginModal(
  status: GoogleCalendarConnectionStatus,
  dismissed: boolean
): boolean {
  return status.configured && !status.connected && !dismissed
}

export function getGoogleCalendarErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return 'Google Calendar sign-in failed. Please try again.'
}
