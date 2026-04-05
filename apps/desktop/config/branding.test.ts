import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT_DIR = join(import.meta.dir, '..', '..', '..')
const DESKTOP_DIR = join(ROOT_DIR, 'apps', 'desktop')

describe('Stride branding', () => {
  test('uses Stride across app packaging, desktop package metadata, and docs', () => {
    const rootPackageJson = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf8')) as {
      name: string
      description: string
    }
    const desktopPackageJson = JSON.parse(readFileSync(join(DESKTOP_DIR, 'package.json'), 'utf8')) as {
      name: string
      description: string
    }
    const electronBuilder = readFileSync(join(DESKTOP_DIR, 'electron-builder.yml'), 'utf8')
    const mainProcessEntry = readFileSync(join(DESKTOP_DIR, 'src', 'main', 'index.ts'), 'utf8')
    const readme = readFileSync(join(ROOT_DIR, 'README.md'), 'utf8')

    expect(rootPackageJson.name).toBe('stride-monorepo')
    expect(rootPackageJson.description).toContain('Stride desktop app')

    expect(desktopPackageJson.name).toBe('@stride/desktop')
    expect(desktopPackageJson.description).toContain('Stride')

    expect(electronBuilder).toContain('appId: com.stride.desktop')
    expect(electronBuilder).toContain('productName: Stride')
    expect(electronBuilder).toContain('executableName: stride')

    expect(mainProcessEntry).toContain("electronApp.setAppUserModelId('com.stride.desktop')")

    expect(readme).toContain('# Stride')
    expect(readme).toContain('Stride desktop app')
  })
})
