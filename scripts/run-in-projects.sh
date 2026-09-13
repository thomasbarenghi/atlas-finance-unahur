#!/usr/bin/env sh
# Runs an npm script across the set-up projects (client, api).
# Projects without a package.json (not scaffolded yet) are skipped.
#
# Usage: sh scripts/run-in-projects.sh <script>
set -u

script="${1:-}"
if [ -z "$script" ]; then
  echo "usage: sh scripts/run-in-projects.sh <script>" >&2
  exit 2
fi

status=0
for dir in client api; do
  if [ -f "$dir/package.json" ]; then
    echo "▶ npm run $script --prefix $dir"
    npm --prefix "$dir" run "$script" --if-present || status=1
  else
    echo "⏭  $dir/ not set up — skipping '$script'"
  fi
done

exit "$status"
