import { resolve } from 'path'

export function resolveDesktopEnvDir(desktopPackageDir: string): string {
  return resolve(desktopPackageDir, '../..')
}
