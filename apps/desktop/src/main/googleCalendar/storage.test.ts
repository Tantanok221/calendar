import { describe, expect, test } from 'bun:test'
import {
  deserializeStoredGoogleTokens,
  serializeStoredGoogleTokens,
  type GoogleTokenSet
} from './storage'

const TOKENS: GoogleTokenSet = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  scope: 'https://www.googleapis.com/auth/calendar',
  tokenType: 'Bearer',
  expiryDate: 1_800_000_000_000
}

describe('serializeStoredGoogleTokens', () => {
  test('round-trips an encrypted token payload', () => {
    const encrypt = (value: string): string => Buffer.from(`enc:${value}`, 'utf8').toString('base64')
    const decrypt = (value: string): string =>
      Buffer.from(value, 'base64').toString('utf8').replace(/^enc:/, '')

    const stored = serializeStoredGoogleTokens(TOKENS, encrypt)

    expect(stored).toEqual({
      version: 1,
      mode: 'encrypted',
      payload: encrypt(JSON.stringify(TOKENS))
    })
    expect(deserializeStoredGoogleTokens(stored, decrypt)).toEqual(TOKENS)
  })

  test('round-trips a plaintext fallback token payload', () => {
    const stored = serializeStoredGoogleTokens(TOKENS)

    expect(stored).toEqual({
      version: 1,
      mode: 'plain',
      payload: JSON.stringify(TOKENS)
    })
    expect(deserializeStoredGoogleTokens(stored)).toEqual(TOKENS)
  })
})
