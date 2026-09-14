#!/usr/bin/env bash
# One port, always. Kills whatever holds 4000, waits for the OS to actually
# release it, then serves the current build. Incrementing the port on every
# rebuild made the URL a moving target for whoever was looking at it.
set -euo pipefail
PORT=4000

# The project folder is cloud-synced, and the sync client leaves conflict
# copies -- "routes.d 2.ts", "cache-life.d 3.ts" -- inside .next. TypeScript
# reads every .ts in there and fails on the duplicate identifiers, which looks
# like a broken build and is not one. Excluding .next from sync is the real
# fix; this keeps the preview working until that happens.
find .next -name "* [0-9].*" -delete 2>/dev/null || true

lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null || true
for _ in $(seq 1 40); do
  lsof -ti tcp:$PORT >/dev/null 2>&1 || break
  sleep 0.25
done

exec npx next start -p $PORT
