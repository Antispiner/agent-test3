#!/usr/bin/env bash
# Seed sample ancestors via the nginx proxy.
set -euo pipefail

BASE="${BASE:-http://localhost:80}"

post() {
  local payload="$1"
  curl -fsS -X POST "$BASE/api/ancestors" \
    -H "Content-Type: application/json" \
    -d "$payload"
  echo
}

post '{"name":"Eleanor Hart","born":1872,"died":1951,"bio":"Schoolteacher in rural Vermont. Fond of poetry."}'
post '{"name":"Tomasz Kowalski","born":1898,"died":1968,"bio":"Polish railway engineer; emigrated 1923."}'
post '{"name":"Mei Lin","born":1915,"died":1999,"bio":"Seamstress, mother of seven, lived through three wars."}'

echo "seeded 3 ancestors via $BASE"
