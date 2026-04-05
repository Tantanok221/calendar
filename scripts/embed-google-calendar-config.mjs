#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = resolve(import.meta.dirname, '..')
const ENV_FILE_PATH = resolve(ROOT_DIR, '.env')
const OUTPUT_FILE_PATH = resolve(ROOT_DIR, 'apps/desktop/build/google-calendar-config.json')

const env = await readEnvFile(ENV_FILE_PATH)
const bundledConfig = {
  clientId: normalizeEnvValue(env.GOOGLE_CALENDAR_CLIENT_ID),
  clientSecret: normalizeEnvValue(env.GOOGLE_CALENDAR_CLIENT_SECRET)
}

await mkdir(dirname(OUTPUT_FILE_PATH), { recursive: true })
await writeFile(`${OUTPUT_FILE_PATH}`,
  `${JSON.stringify(bundledConfig, null, 2)}\n`,
  'utf8'
)

async function readEnvFile(path) {
  try {
    return parseDotEnv(await readFile(path, 'utf8'))
  } catch (error) {
    if (isMissingFileError(error)) {
      return {}
    }

    throw error
  }
}

function parseDotEnv(rawEnv) {
  const parsedEnv = {}

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

    if (key) {
      parsedEnv[key] = stripMatchingQuotes(value)
    }
  }

  return parsedEnv
}

function normalizeEnvValue(value) {
  const trimmedValue = value?.trim()
  return trimmedValue ? trimmedValue : null
}

function stripMatchingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function isMissingFileError(error) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}
