declare module 'bun:test' {
  interface BunTestMatchers {
    not: BunTestMatchers
    toBe(expected: unknown): void
    toContain(expected: string): void
    toEqual(expected: unknown): void
  }

  export function describe(name: string, fn: () => void): void
  export function expect(value: unknown): BunTestMatchers
  export function test(name: string, fn: () => void | Promise<void>): void
}
