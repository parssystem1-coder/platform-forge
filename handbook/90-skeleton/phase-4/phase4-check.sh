#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

printf '%s\n' 'Checking architecture debt closure prerequisites...'
command -v pnpm >/dev/null
pnpm typecheck
pnpm test
pnpm boundaries
pnpm openapi:check
pnpm test:tenant-leak
printf '%s\n' 'Phase 4 checks passed.'
