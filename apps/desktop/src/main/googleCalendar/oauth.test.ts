import { describe, expect, test } from 'bun:test'
import {
  buildGoogleAuthorizationUrl,
  createGoogleCodeChallenge,
  exchangeGoogleAuthorizationCode
} from './oauth'

describe('buildGoogleAuthorizationUrl', () => {
  test('builds a desktop OAuth url with PKCE and offline access', () => {
    const url = buildGoogleAuthorizationUrl({
      clientId: 'desktop-client-id.apps.googleusercontent.com',
      redirectUri: 'http://127.0.0.1:43123/oauth/google/callback',
      scopes: ['https://www.googleapis.com/auth/calendar'],
      state: 'state-123',
      codeChallenge: 'challenge-123'
    })

    expect(url).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&client_id=desktop-client-id.apps.googleusercontent.com&code_challenge=challenge-123&code_challenge_method=S256&prompt=consent&redirect_uri=http%3A%2F%2F127.0.0.1%3A43123%2Foauth%2Fgoogle%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar&state=state-123'
    )
  })
})

describe('createGoogleCodeChallenge', () => {
  test('returns a URL-safe S256 challenge', async () => {
    const challenge = await createGoogleCodeChallenge(
      'verifier-value-with-enough-length-to-look-real'
    )

    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(challenge).not.toContain('=')
  })
})

describe('exchangeGoogleAuthorizationCode', () => {
  test('sends an optional client secret when configured', async () => {
    let requestBody = ''

    await exchangeGoogleAuthorizationCode({
      clientId: 'desktop-client-id.apps.googleusercontent.com',
      clientSecret: 'desktop-client-secret',
      code: 'code-123',
      codeVerifier: 'verifier-123',
      redirectUri: 'http://127.0.0.1:43123/oauth/google/callback',
      fetchImpl: async (_, init) => {
        requestBody = String(init?.body)

        return new Response(
          JSON.stringify({
            access_token: 'access-token'
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
    })

    expect(requestBody).toContain('client_secret=desktop-client-secret')
  })

  test('explains when the configured Google OAuth client expects a client secret', async () => {
    await expect(
      exchangeGoogleAuthorizationCode({
        clientId: 'desktop-client-id.apps.googleusercontent.com',
        code: 'code-123',
        codeVerifier: 'verifier-123',
        redirectUri: 'http://127.0.0.1:43123/oauth/google/callback',
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              error: 'invalid_request',
              error_description: 'client_secret is missing.'
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )
      })
    ).rejects.toThrow(
      'Google token exchange failed: the configured OAuth client requires a client secret. This app expects a Google Desktop app OAuth client that works with PKCE, not a Web application client.'
    )
  })
})
