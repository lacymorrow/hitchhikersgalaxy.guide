#!/usr/bin/env bash
# Fails when public/r is out of date with registry.json and the source files it points at.
# Fix with: bun run build:registry
set -euo pipefail
cd "$(dirname "$0")/.."
out="$(mktemp -d)"
trap 'rm -rf "$out"' EXIT
npx --yes shadcn@latest build --output "$out" >/dev/null
if diff -rq "$out" public/r >/dev/null; then
  echo "registry: public/r matches registry.json"
else
  echo "registry: public/r is stale. Run 'bun run build:registry' and commit public/r." >&2
  diff -rq "$out" public/r >&2 || true
  exit 1
fi
