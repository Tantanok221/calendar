import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveDesktopDirFromMainFile } from '../env'
import type { GoogleCalendarConfig } from './types'

export const GOOGLE_CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar'] as const
export const GOOGLE_CALENDAR_CALLBACK_PATH = '/oauth/google/callback'

interface BundledGoogleCalendarConfigShape {
  clientId?: string | null
  clientSecret?: string | null
}

interface LoadGoogleCalendarConfigOptions {
  isPackaged: boolean
  mainFile: string
  resourcesPath: string
}

const GOOGLE_CALENDAR_CONFIG_FILE_NAME = 'google-calendar-config.json'

export function readGoogleCalendarConfig(
  config: BundledGoogleCalendarConfigShape | null
): GoogleCalendarConfig | null {
  const clientId = config?.clientId?.trim()
  const clientSecret = config?.clientSecret?.trim()

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

export async function loadGoogleCalendarConfig(
  options: LoadGoogleCalendarConfigOptions
): Promise<GoogleCalendarConfig | null> {
  try {
    const rawConfig = await readFile(resolveGoogleCalendarConfigPath(options), 'utf8')

    return readGoogleCalendarConfig(JSON.parse(rawConfig) as BundledGoogleCalendarConfigShape)
  } catch (error) {
    if (isMissingFileError(error)) {
      return null
    }

    throw error
  }
}

function resolveGoogleCalendarConfigPath(options: LoadGoogleCalendarConfigOptions): string {
  if (options.isPackaged) {
    return resolve(options.resourcesPath, GOOGLE_CALENDAR_CONFIG_FILE_NAME)
  }

  return resolve(
    resolveDesktopDirFromMainFile(options.mainFile),
    'build',
    GOOGLE_CALENDAR_CONFIG_FILE_NAME
  )
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}
