import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('mac packaging config', () => {
  test('allows the packaged Stride app to load Electron Framework under hardened runtime', () => {
    const desktopDir = join(import.meta.dir, '..')
    const electronBuilder = readFileSync(join(desktopDir, 'electron-builder.yml'), 'utf8')
    const entitlements = readFileSync(join(desktopDir, 'build', 'entitlements.mac.plist'), 'utf8')

    expect(electronBuilder).toContain('entitlementsInherit: build/entitlements.mac.plist')
    expect(entitlements).toContain('com.apple.security.cs.disable-library-validation')
  })

  test('bundles the generated Google Calendar config into the mac app resources', () => {
    const desktopDir = join(import.meta.dir, '..')
    const electronBuilder = readFileSync(join(desktopDir, 'electron-builder.yml'), 'utf8')

    expect(electronBuilder).toContain('extraResources:')
    expect(electronBuilder).toContain('from: build/google-calendar-config.json')
    expect(electronBuilder).toContain('to: google-calendar-config.json')
  })
})
