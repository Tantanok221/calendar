import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export async function loadDesktopRootEnv(
  desktopDir: string,
  env: Record<string, string | undefined> = process.env
): Promise<void> {
  const envFilePath = resolve(desktopDir, '../..', '.env')

  try {
    const rawEnv = await readFile(envFilePath, 'utf8')

    for (const line of rawEnv.split(/\r?\n/)) {
      const trimmedLine = line.trim()

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue
      }

      const separatorIndex = trimmedLine.indexOf('=')

      if (separatorIndex === -1) {
        continue
      }

      const key = trimmedLine.slice(0, separatorIndex).trim()
      const value = trimmedLine.slice(separatorIndex + 1).trim()

      if (key && env[key] === undefined) {
        env[key] = stripMatchingQuotes(value)
      }
    }
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error
    }
  }
}

export function resolveDesktopDirFromMainFile(mainFile: string): string {
  return resolve(mainFile, '..', '..')
}

function stripMatchingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}
