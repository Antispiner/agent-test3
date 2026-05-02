# Ancestor Chat — E2E

Playwright suite that drives the full stack (nginx → React → Spring server → SQLite) end-to-end.

## Prerequisites

- Docker + Docker Compose
- Node 20+
- Server PR #2, web PR #4, docker PR #3 merged (or rebased onto this branch)

## Mocking Anthropic

E2E must not hit the real Anthropic API. The override compose file sets `MOCK_ANTHROPIC=true`:

```
e2e/docker/docker-compose.test.yml → server.environment.MOCK_ANTHROPIC=true
```

**Server contract (must be honored by PR #2):** when `MOCK_ANTHROPIC=true`, `AnthropicClient.streamChat` returns canned SSE chunks (e.g. a fixed apologetic line) and never opens an HTTP connection to `api.anthropic.com`. A comment has been filed on PR #2 requesting this flag.

If PR #2 ships without `MOCK_ANTHROPIC` support, you have two options:

1. **Demo path** — provide a real `ANTHROPIC_API_KEY` in `.env` and skip E2E gating in CI. The test will still pass against live Anthropic but is non-deterministic and costs tokens. Mark the workflow as `continue-on-error` until the flag lands.
2. **Stub sidecar (not implemented here)** — add an `httpbin`-style mock container at `api.anthropic.com` via compose `extra_hosts`. Avoided because nginx-layer mocking of streaming SSE is fragile.

Default: option 1 until the server flag lands.

## Run

```bash
cd e2e
cp .env.example .env
npm ci
npx playwright install --with-deps chromium

# from repo root:
docker compose -f docker-compose.yml -f e2e/docker/docker-compose.test.yml up -d --build

cd e2e
npm test

# tear down:
cd ..
docker compose -f docker-compose.yml -f e2e/docker/docker-compose.test.yml down -v
```

## What it covers

`tests/ancestor-chat.spec.ts` — single happy-path:

1. Open `/`
2. Click `+ Add`, fill form (name "Бабушка Алла", relation "бабушка", birth 1920, death 1995, birthplace "Малешев", language "ru", life event "пережила войну")
3. Submit, assert redirect to `/chat/{id}`
4. Send "Расскажи о войне"
5. Assert ancestor reply renders with non-empty text
6. Assert `GET /api/chat/{id}/messages` returns ≥ 2 rows

## CI notes

Until `MOCK_ANTHROPIC` lands on the server, gate this workflow with `continue-on-error: true` or scope it to manual demo runs. The bring-up costs ~60-90s for first build (Maven + npm + nginx).
