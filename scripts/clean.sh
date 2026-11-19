#!/usr/bin/env sh
# Removes installed dependencies and generated build/test output so the
# monorepo can be reinstalled and rebuilt from scratch.
#
# Usage:
#   npm run clean
#   npm run clean -- --dry-run   # list what would be removed
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

dry_run=0
case "${1:-}" in
  "") ;;
  -n | --dry-run) dry_run=1 ;;
  *)
    echo "usage: sh scripts/clean.sh [--dry-run]" >&2
    exit 2
    ;;
esac

tmp=$(mktemp "${TMPDIR:-/tmp}/atlas-clean.XXXXXX")
trap 'rm -f "$tmp"' EXIT HUP INT TERM

# Every installed dependency tree, including nested workspaces.
find "$root" -name .git -prune -o -type d -name node_modules -prune -print >"$tmp"

# Generated build and test output directories.
find "$root" \
  \( -name .git -o -name node_modules \) -prune -o \
  -type d \( \
    -name .next -o \
    -name .turbo -o \
    -name dist -o \
    -name build -o \
    -name out -o \
    -name coverage -o \
    -name storybook-static -o \
    -name playwright-report -o \
    -name test-results -o \
    -name blob-report \
  \) -prune -print >>"$tmp"

# Root-level generated output and incremental build metadata.
[ -e "$root/_build" ] && printf '%s\n' "$root/_build" >>"$tmp"
find "$root" \
  \( \
    -name .git -o \
    -name node_modules -o \
    -name .next -o \
    -name .turbo -o \
    -name dist -o \
    -name build -o \
    -name out -o \
    -name coverage \
  \) -prune -o \
  -type f \( -name '*.tsbuildinfo' -o -name '.eslintcache' \) -print >>"$tmp"

sort -u "$tmp" -o "$tmp"

total=0
failed=0
while IFS= read -r path; do
  [ -e "$path" ] || continue
  rel=${path#"$root"/}
  total=$((total + 1))

  if [ "$dry_run" -eq 1 ]; then
    printf '  %s\n' "$rel"
    continue
  fi

  if rm -rf "$path"; then
    printf '  removed %s\n' "$rel"
  else
    printf '  FAILED  %s\n' "$rel" >&2
    failed=$((failed + 1))
  fi
done <"$tmp"

if [ "$total" -eq 0 ]; then
  echo "Nothing to clean."
elif [ "$dry_run" -eq 1 ]; then
  echo "Would remove $total path(s). Nothing was deleted (dry run)."
else
  echo "Removed $total path(s)."
fi

[ "$failed" -eq 0 ] || exit 1
