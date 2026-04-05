import { resolve } from 'node:path'

export function resolveDesktopDirFromMainFile(mainFile: string): string {
  return resolve(mainFile, '..', '..')
}
