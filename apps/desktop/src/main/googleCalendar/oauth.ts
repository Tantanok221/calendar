import { createHash, randomBytes } from 'node:crypto'
import type { GoogleTokenSet } from './types'

interface GoogleAuthorizationUrlInput {
  clientId: string
  redirectUri: string
  scopes: readonly string[]
  state: string
  codeChallenge: string
  authBaseUrl?: string
}

interface ExchangeGoogleCodeInput {
  clientId: string
  clientSecret?: string | null
  code: string
  codeVerifier: string
  redirectUri: string
  tokenUrl?: string
  fetchImpl?: typeof fetch
}

interface RefreshGoogleTokenInput {
  clientId: string
  clientSecret?: string | null
  refreshToken: string
  tokenUrl?: string
  fetchImpl?: typeof fetch
}

interface RawTokenResponse {
  access_token: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  token_type?: string
}

interface RawGoogleTokenErrorResponse {
  error?: string
  error_description?: string
}

export function createGoogleCodeVerifier(): string {
  return randomBytes(32).toString('base64url')
}

export async function createGoogleCodeChallenge(codeVerifier: string): Promise<string> {
  return createHash('sha256').update(codeVerifier).digest('base64url')
}

export function buildGoogleAuthorizationUrl(input: GoogleAuthorizationUrlInput): string {
  const searchParams = new URLSearchParams([
    ['access_type', 'offline'],
    ['client_id', input.clientId],
    ['code_challenge', input.codeChallenge],
    ['code_challenge_method', 'S256'],
    ['prompt', 'consent'],
    ['redirect_uri', input.redirectUri],
    ['response_type', 'code'],
    ['scope', input.scopes.join(' ')],
    ['state', input.state]
  ])

  return `${input.authBaseUrl ?? 'https://accounts.google.com/o/oauth2/v2/auth'}?${searchParams.toString()}`
}

export async function exchangeGoogleAuthorizationCode(
  input: ExchangeGoogleCodeInput
): Promise<GoogleTokenSet> {
  const response = await (input.fetchImpl ?? fetch)(input.tokenUrl ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: input.clientId,
      ...(input.clientSecret ? { client_secret: input.clientSecret } : {}),
      code: input.code,
      code_verifier: input.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: input.redirectUri
    })
  })

  return toGoogleTokenSet(await parseTokenResponse(response))
}

export async function refreshGoogleAccessToken(
  input: RefreshGoogleTokenInput
): Promise<GoogleTokenSet> {
  const response = await (input.fetchImpl ?? fetch)(input.tokenUrl ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: input.clientId,
      ...(input.clientSecret ? { client_secret: input.clientSecret } : {}),
      grant_type: 'refresh_token',
      refresh_token: input.refreshToken
    })
  })

  const tokenSet = toGoogleTokenSet(await parseTokenResponse(response))

  return {
    ...tokenSet,
    refreshToken: tokenSet.refreshToken ?? input.refreshToken
  }
}

async function parseTokenResponse(response: Response): Promise<RawTokenResponse> {
  if (!response.ok) {
    throw new Error(formatGoogleTokenExchangeError(response.status, await response.text()))
  }

  return (await response.json()) as RawTokenResponse
}

function formatGoogleTokenExchangeError(status: number, responseText: string): string {
  const errorResponse = parseGoogleTokenErrorResponse(responseText)

  if (
    errorResponse?.error === 'invalid_request' &&
    errorResponse.error_description?.includes('client_secret is missing')
  ) {
    return 'Google token exchange failed: the configured OAuth client requires a client secret. This app expects a Google Desktop app OAuth client that works with PKCE, not a Web application client.'
  }

  return `Google token exchange failed with status ${status}: ${responseText}`
}

function parseGoogleTokenErrorResponse(responseText: string): RawGoogleTokenErrorResponse | null {
  try {
    return JSON.parse(responseText) as RawGoogleTokenErrorResponse
  } catch {
    return null
  }
}

function toGoogleTokenSet(response: RawTokenResponse): GoogleTokenSet {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token ?? null,
    scope: response.scope ?? '',
    tokenType: response.token_type ?? 'Bearer',
    expiryDate: response.expires_in ? Date.now() + response.expires_in * 1000 : null
  }
}
