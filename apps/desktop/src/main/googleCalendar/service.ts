import { createServer } from 'node:http'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { app, safeStorage, shell } from 'electron'
import { GOOGLE_CALENDAR_CALLBACK_PATH, readGoogleCalendarConfig } from './config'
import {
  createGoogleCalendarEvent,
  fetchGoogleCalendarEvents,
  fetchGoogleCalendars,
  updateGoogleCalendarEvent
} from './api'
import {
  buildGoogleAuthorizationUrl,
  createGoogleCodeChallenge,
  createGoogleCodeVerifier,
  exchangeGoogleAuthorizationCode,
  refreshGoogleAccessToken
} from './oauth'
import { FileGoogleTokenStore } from './storage'
import type {
  CreateGoogleCalendarEventInput,
  GoogleCalendarConnectionStatus,
  GoogleCalendarEvent,
  GoogleCalendarSummary,
  GoogleTokenSet,
  ListGoogleCalendarEventsInput,
  UpdateGoogleCalendarEventInput
} from './types'

const TOKEN_FILE_NAME = 'google-calendar-tokens.json'
const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60_000
const AUTH_FLOW_TIMEOUT_MS = 120_000

export class GoogleCalendarService {
  private readonly tokenStore = new FileGoogleTokenStore({
    filePath: join(app.getPath('userData'), TOKEN_FILE_NAME),
    encrypt: safeStorage.isEncryptionAvailable()
      ? (value) => safeStorage.encryptString(value).toString('base64')
      : undefined,
    decrypt: safeStorage.isEncryptionAvailable()
      ? (value) => safeStorage.decryptString(Buffer.from(value, 'base64'))
      : undefined
  })

  async getStatus(): Promise<GoogleCalendarConnectionStatus> {
    const config = readGoogleCalendarConfig(process.env)

    if (!config) {
      return {
        configured: false,
        connected: false,
        hasRefreshToken: false
      }
    }

    const tokens = await this.tokenStore.load()

    if (!tokens) {
      return {
        configured: true,
        connected: false,
        hasRefreshToken: false
      }
    }

    try {
      const validTokens = await this.ensureValidTokens(
        config.clientId,
        config.clientSecret,
        config.tokenUrl,
        tokens
      )
      await this.tokenStore.save(validTokens)

      return {
        configured: true,
        connected: true,
        hasRefreshToken: Boolean(validTokens.refreshToken)
      }
    } catch {
      await this.tokenStore.clear()

      return {
        configured: true,
        connected: false,
        hasRefreshToken: false
      }
    }
  }

  async connect(): Promise<GoogleCalendarConnectionStatus> {
    const config = readGoogleCalendarConfig(process.env)

    if (!config) {
      throw new Error('GOOGLE_CALENDAR_CLIENT_ID is not configured')
    }

    const codeVerifier = createGoogleCodeVerifier()
    const codeChallenge = await createGoogleCodeChallenge(codeVerifier)
    const state = randomUUID()

    const server = createServer()
    const authCodePromise = new Promise<{ code: string; redirectUri: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for Google authorization'))
      }, AUTH_FLOW_TIMEOUT_MS)

      server.on('request', (request, response) => {
        const host = request.headers.host

        if (!host) {
          response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
          response.end('Missing host header')
          return
        }

        const requestUrl = new URL(request.url ?? '/', `http://${host}`)

        if (requestUrl.pathname !== GOOGLE_CALENDAR_CALLBACK_PATH) {
          response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
          response.end('Not found')
          return
        }

        const returnedState = requestUrl.searchParams.get('state')
        const error = requestUrl.searchParams.get('error')
        const code = requestUrl.searchParams.get('code')

        if (error) {
          response.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
          response.end(renderAuthResultHtml('Google Calendar connection failed. You can close this window.'))
          clearTimeout(timeout)
          reject(new Error(`Google authorization failed: ${error}`))
          void server.close()
          return
        }

        if (!code || returnedState !== state) {
          response.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
          response.end(renderAuthResultHtml('Invalid Google authorization response. You can close this window.'))
          clearTimeout(timeout)
          reject(new Error('Received an invalid Google authorization response'))
          void server.close()
          return
        }

        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        response.end(renderAuthResultHtml('Google Calendar is connected. You can close this window.'))

        clearTimeout(timeout)
        resolve({
          code,
          redirectUri: `http://${host}${GOOGLE_CALENDAR_CALLBACK_PATH}`
        })
        void server.close()
      })
    })

    const redirectUri = await new Promise<string>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, config.redirectHost, () => {
        const address = server.address()

        if (!address || typeof address === 'string') {
          reject(new Error('Failed to start the Google OAuth callback server'))
          return
        }

        resolve(`http://${config.redirectHost}:${address.port}${GOOGLE_CALENDAR_CALLBACK_PATH}`)
      })
    })

    await shell.openExternal(
      buildGoogleAuthorizationUrl({
        clientId: config.clientId,
        redirectUri,
        scopes: config.scopes,
        state,
        codeChallenge,
        authBaseUrl: config.authBaseUrl
      })
    )

    const { code, redirectUri: completedRedirectUri } = await authCodePromise
    const tokens = await exchangeGoogleAuthorizationCode({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      code,
      codeVerifier,
      redirectUri: completedRedirectUri,
      tokenUrl: config.tokenUrl
    })

    await this.tokenStore.save(tokens)

    return {
      configured: true,
      connected: true,
      hasRefreshToken: Boolean(tokens.refreshToken)
    }
  }

  async disconnect(): Promise<void> {
    await this.tokenStore.clear()
  }

  async listCalendars(): Promise<GoogleCalendarSummary[]> {
    const config = readGoogleCalendarConfig(process.env)

    if (!config) {
      throw new Error('GOOGLE_CALENDAR_CLIENT_ID is not configured')
    }

    const accessToken = await this.getAccessToken(config.clientId, config.clientSecret, config.tokenUrl)

    return fetchGoogleCalendars({
      accessToken,
      apiBaseUrl: config.apiBaseUrl
    })
  }

  async listEvents(input: ListGoogleCalendarEventsInput = {}): Promise<GoogleCalendarEvent[]> {
    const config = readGoogleCalendarConfig(process.env)

    if (!config) {
      throw new Error('GOOGLE_CALENDAR_CLIENT_ID is not configured')
    }

    const accessToken = await this.getAccessToken(config.clientId, config.clientSecret, config.tokenUrl)

    return fetchGoogleCalendarEvents({
      ...input,
      accessToken,
      apiBaseUrl: config.apiBaseUrl
    })
  }

  async updateEvent(input: UpdateGoogleCalendarEventInput): Promise<GoogleCalendarEvent> {
    const config = readGoogleCalendarConfig(process.env)

    if (!config) {
      throw new Error('GOOGLE_CALENDAR_CLIENT_ID is not configured')
    }

    const accessToken = await this.getAccessToken(config.clientId, config.clientSecret, config.tokenUrl)

    return updateGoogleCalendarEvent({
      ...input,
      accessToken,
      apiBaseUrl: config.apiBaseUrl
    })
  }

  async createEvent(input: CreateGoogleCalendarEventInput): Promise<GoogleCalendarEvent> {
    const config = readGoogleCalendarConfig(process.env)

    if (!config) {
      throw new Error('GOOGLE_CALENDAR_CLIENT_ID is not configured')
    }

    const accessToken = await this.getAccessToken(config.clientId, config.clientSecret, config.tokenUrl)

    return createGoogleCalendarEvent({
      ...input,
      accessToken,
      apiBaseUrl: config.apiBaseUrl
    })
  }

  private async getAccessToken(
    clientId: string,
    clientSecret: string | null,
    tokenUrl: string
  ): Promise<string> {
    const tokens = await this.tokenStore.load()

    if (!tokens) {
      throw new Error('Google Calendar is not connected')
    }

    const validTokens = await this.ensureValidTokens(clientId, clientSecret, tokenUrl, tokens)
    await this.tokenStore.save(validTokens)

    return validTokens.accessToken
  }

  private async ensureValidTokens(
    clientId: string,
    clientSecret: string | null,
    tokenUrl: string,
    tokens: GoogleTokenSet
  ): Promise<GoogleTokenSet> {
    const refreshDeadline = Date.now() + ACCESS_TOKEN_REFRESH_WINDOW_MS

    if (tokens.expiryDate && tokens.expiryDate > refreshDeadline) {
      return tokens
    }

    if (!tokens.refreshToken) {
      if (tokens.expiryDate && tokens.expiryDate <= refreshDeadline) {
        throw new Error('Stored Google Calendar access token has expired')
      }

      return tokens
    }

    return refreshGoogleAccessToken({
      clientId,
      clientSecret,
      refreshToken: tokens.refreshToken,
      tokenUrl
    })
  }
}

function renderAuthResultHtml(message: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Google Calendar</title>
    <style>
      :root {
        color-scheme: light dark;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: ui-sans-serif, system-ui, sans-serif;
        background: #111827;
        color: #f9fafb;
      }

      main {
        max-width: 420px;
        padding: 24px;
        border-radius: 16px;
        background: rgba(17, 24, 39, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
        text-align: center;
      }
    </style>
  </head>
  <body>
    <main>
      <p>${message}</p>
    </main>
  </body>
</html>`
}
