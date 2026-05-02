---
id: ADR-0001
title: Ancestor Chat — stack and design
status: accepted
date: 2026-05-02
---

# ADR-0001: Ancestor Chat

## Problem

Provide persona-grounded chat with deceased ancestors. User describes an ancestor
(name, relation, dates, place, profession, life events, personality, historical
context). System must roleplay as that ancestor, staying strictly in character,
using period-appropriate vocabulary, and refusing knowledge of events after the
ancestor's death year.

## Decision

### Stack

- **Backend**: Java 21 + Spring Boot 3.3 + SQLite JDBC
- **LLM**: Anthropic Messages API (env `ANTHROPIC_API_KEY`)
- **Frontend**: React 19 + Vite 7 + TypeScript + hand-rolled Tailwind v4
- **Storage**: SQLite for ancestor profiles and chat history

### LLM choice

Anthropic Messages API direct (not Ollama, not OpenAI). Reasons: quality of
persona adherence, simpler ops (no local model server), single SDK surface.

### Streaming

SSE (Server-Sent Events) for streaming chat responses. No WebSocket — chat is
unidirectional stream per request, SSE is sufficient and simpler through nginx.

### Persona prompt template

See [api/spec.md](../../api/spec.md) — section "Persona prompt template" defines
the exact system message sent to Anthropic for every chat turn.

### Knowledge cutoff

The persona's effective knowledge cutoff equals `death_year`. The model is
instructed to refuse or deflect any question about events after that year,
saying it would not know because it has already passed. This is enforced via
prompt instruction, not via post-hoc filtering.

## Consequences

- Requires `ANTHROPIC_API_KEY` to run.
- SQLite is single-file, simple to back up, sufficient for demo scale.
- SSE requires nginx `proxy_buffering off` for the chat endpoint.
- Persona quality is bounded by prompt — no fine-tuning, no RAG.
