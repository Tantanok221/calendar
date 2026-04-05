#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

bun install
bun run build:unpack
rm -rf "/Applications/Stride.app"
ditto "apps/desktop/dist/mac-arm64/Stride.app" "/Applications/Stride.app"
