import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { GoogleTokenSet, StoredGoogleTokens } from './types'

export type { GoogleTokenSet } from './types'

type EncryptFn = (value: string) => string
type DecryptFn = (value: string) => string

export function serializeStoredGoogleTokens(
  tokens: GoogleTokenSet,
  encrypt?: EncryptFn
): StoredGoogleTokens {
  const payload = JSON.stringify(tokens)

  if (!encrypt) {
    return {
      version: 1,
      mode: 'plain',
      payload
    }
  }

  return {
    version: 1,
    mode: 'encrypted',
    payload: encrypt(payload)
  }
}

export function deserializeStoredGoogleTokens(
  stored: StoredGoogleTokens,
  decrypt?: DecryptFn
): GoogleTokenSet {
  const payload = stored.mode === 'encrypted' ? decrypt?.(stored.payload) ?? stored.payload : stored.payload
  return JSON.parse(payload) as GoogleTokenSet
}

interface FileGoogleTokenStoreOptions {
  filePath: string
  encrypt?: EncryptFn
  decrypt?: DecryptFn
}

export class FileGoogleTokenStore {
  constructor(private readonly options: FileGoogleTokenStoreOptions) {}

  async load(): Promise<GoogleTokenSet | null> {
    try {
      const rawValue = await readFile(this.options.filePath, 'utf8')
      const stored = JSON.parse(rawValue) as StoredGoogleTokens

      return deserializeStoredGoogleTokens(stored, this.options.decrypt)
    } catch (error) {
      if (isMissingFileError(error)) {
        return null
      }

      throw error
    }
  }

  async save(tokens: GoogleTokenSet): Promise<void> {
    await mkdir(dirname(this.options.filePath), { recursive: true })

    const stored = serializeStoredGoogleTokens(tokens, this.options.encrypt)
    await writeFile(this.options.filePath, JSON.stringify(stored), 'utf8')
  }

  async clear(): Promise<void> {
    try {
      await rm(this.options.filePath)
    } catch (error) {
      if (!isMissingFileError(error)) {
        throw error
      }
    }
  }
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}
