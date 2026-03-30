import { describe, expect, test } from 'bun:test'
import { resolveDesktopEnvDir } from './envDir'

describe('resolveDesktopEnvDir', () => {
  test('points electron-vite at the monorepo root .env directory', () => {
    expect(resolveDesktopEnvDir('/Users/tantanok/c/worktrees/great-coats-hope-76v/apps/desktop')).toBe(
      '/Users/tantanok/c/worktrees/great-coats-hope-76v'
    )
  })
})
