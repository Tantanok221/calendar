import type { GoogleCalendarConnectionStatus } from '../../../main/googleCalendar/types'

export function shouldOpenGoogleCalendarLoginModal(
  status: GoogleCalendarConnectionStatus,
  dismissed: boolean
): boolean {
  return status.configured && !status.connected && !dismissed
}

export function getGoogleCalendarErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return unwrapElectronInvokeErrorMessage(error.message)
  }

  return 'Google Calendar sign-in failed. Please try again.'
}

function unwrapElectronInvokeErrorMessage(message: string): string {
  const trimmedMessage = message.trim()
  const invokePrefixMatch = trimmedMessage.match(/^Error invoking remote method '[^']+': Error: (.+)$/)

  if (invokePrefixMatch) {
    return invokePrefixMatch[1].trim()
  }

  return trimmedMessage
}
