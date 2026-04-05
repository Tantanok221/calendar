import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('mac install script', () => {
  test('provides a root script that installs and copies Stride into /Applications', () => {
    const rootDir = join(import.meta.dir, '..', '..', '..')
    const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
    }
    const installScript = readFileSync(
      join(rootDir, 'scripts', 'install-current-revision-mac.sh'),
      'utf8'
    )

    expect(packageJson.scripts['prepare:google-calendar-config']).toBe(
      'node ./scripts/embed-google-calendar-config.mjs'
    )
    expect(packageJson.scripts['build:unpack']).toBe(
      'bun run prepare:google-calendar-config && bun run --cwd apps/desktop build:unpack'
    )
    expect(packageJson.scripts['install:mac']).toBe('bash ./scripts/install-current-revision-mac.sh')
    expect(installScript).toContain('bun install')
    expect(installScript).toContain('bun run build:unpack')
    expect(installScript).toContain('rm -rf "/Applications/Stride.app"')
    expect(installScript).toContain('ditto "apps/desktop/dist/mac-arm64/Stride.app" "/Applications/Stride.app"')
    expect(installScript).not.toContain('Contents/.env')
    expect(installScript).not.toContain('open "/Applications/Stride.app"')
  })
})
