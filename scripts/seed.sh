#!/usr/bin/env bash
# Seed sample ancestor profiles into a running Ancestor Chat backend.
# Usage:   ./scripts/seed.sh
#          API_BASE=http://localhost:8080 ./scripts/seed.sh
# Default API_BASE matches the docker-compose nginx (port 80).

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:80}"
DATA_FILE="${DATA_FILE:-data/sample-ancestors.json}"

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required (brew install jq)" >&2
  exit 1
fi

if [[ ! -f "$DATA_FILE" ]]; then
  echo "error: $DATA_FILE not found (run from repo root)" >&2
  exit 1
fi

count=$(jq 'length' "$DATA_FILE")
echo "Seeding $count ancestor profiles to $API_BASE/api/ancestors ..."

for i in $(seq 0 $((count - 1))); do
  entry=$(jq -c ".[$i]" "$DATA_FILE")
  name=$(jq -r ".[$i].name" "$DATA_FILE")
  http_code=$(curl -sS -o /tmp/seed-resp.$$ -w "%{http_code}" \
    -X POST "$API_BASE/api/ancestors" \
    -H "Content-Type: application/json" \
    -d "$entry")
  if [[ "$http_code" =~ ^2 ]]; then
    id=$(jq -r '.id // empty' /tmp/seed-resp.$$ 2>/dev/null || true)
    echo "  ok  [$http_code]  $name  ${id:+(id=$id)}"
  else
    echo "  fail [$http_code] $name" >&2
    cat /tmp/seed-resp.$$ >&2
    echo >&2
    rm -f /tmp/seed-resp.$$
    exit 1
  fi
  rm -f /tmp/seed-resp.$$
done

echo "Done."
