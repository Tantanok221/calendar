# Stride

A Bun monorepo for the Stride desktop app and future shared or backend packages.

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

# Unpacked macOS app bundle
$ bun run build:unpack

# For macOS
$ bun run build:mac

# For Windows
$ bun run build:win

# For Linux
$ bun run build:linux
```

### Install the current revision on macOS

Use the install script to install dependencies, generate a bundled Google Calendar config from the repo-root `.env`, build the unpacked app, remove the old app bundle, and copy the new one into `/Applications`:

```bash
$ bun run install:mac
```

That runs this sequence:

```bash
$ bun install
$ bun run prepare:google-calendar-config
$ bun run build:unpack
$ rm -rf "/Applications/Stride.app"
$ ditto "apps/desktop/dist/mac-arm64/Stride.app" "/Applications/Stride.app"
```

If you prefer a macOS installer artifact instead, build the macOS distribution files:

```bash
$ bun run build:mac
$ open apps/desktop/dist
```

### Remove quarantine bits on macOS

If macOS flags the installed app as quarantined, remove the quarantine attribute recursively:

```bash
$ xattr -dr com.apple.quarantine "/Applications/Stride.app"
```

To check whether the quarantine attribute is present:

```bash
$ xattr -lr "/Applications/Stride.app" | rg quarantine
```

Note: locally built app bundles may not have `com.apple.quarantine` at all. You might instead see `com.apple.provenance`, which is different.

### Test

```bash
$ bun test
```
