# Calendar

A Bun monorepo for the Calendar desktop app and future shared or backend packages.

## Workspace Layout

- `apps/desktop`: Electron desktop app
- `packages/*`: shared packages for future backend or app code

## Project Setup

### Install

```bash
$ bun install
```

### Development

```bash
$ bun run dev
```

The root scripts forward to the desktop app in `apps/desktop`.

### Build

```bash
# App build
$ bun run build

# For macOS
$ bun run build:mac

# For Windows
$ bun run build:win

# For Linux
$ bun run build:linux
```

### Test

```bash
$ bun test
```
