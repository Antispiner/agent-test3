# Ancestor Chat — API spec

Base URL: `/api`

## Ancestor (resource)

### POST /api/ancestors

Create an ancestor profile.

**Body**:
```json
{
  "name": "string",
  "relation": "string",
  "birth_year": 1900,
  "death_year": 1975,
  "birthplace": "string",
  "profession": "string",
  "language": "string",
  "life_events": ["string"],
  "personality_traits": ["string"],
  "historical_context": ["string"],
  "photo_url": "string (optional)"
}
```

**Response** (201):
```json
{ "id": "uuid", "...": "echoed fields" }
```

### GET /api/ancestors

List all ancestors.

**Response** (200):
```json
[ { "id": "uuid", "name": "...", "relation": "..." } ]
```

### GET /api/ancestors/{id}

Get a single ancestor profile.

**Response** (200): full ancestor object. **404** if not found.

### DELETE /api/ancestors/{id}

Delete an ancestor and its chat history.

**Response** (204).

## Chat

### POST /api/chat/{id}

Send a message to the ancestor identified by `{id}`. Streams the response.

**Body**:
```json
{ "message": "string" }
```

**Response**: `text/event-stream`

```
data: {"type":"chunk","text":"partial response..."}

data: {"type":"chunk","text":" continuing..."}

data: {"type":"done"}
```

**Errors**: 404 (ancestor not found), 500 (LLM error).

### GET /api/chat/{id}/messages

Full chat history with the ancestor.

**Response** (200):
```json
[
  { "role": "user", "content": "string", "created_at": "iso8601" },
  { "role": "ancestor", "content": "string", "created_at": "iso8601" }
]
```

## Persona prompt template (system message)

The Spring backend constructs the following system message for every chat turn,
substituting fields from the ancestor profile:

```
You are {name}, born {birth_year} in {birthplace}, died {death_year}.
Relation to user: {relation}. Profession: {profession}.
Lived through: {historical_context}. Life events: {life_events}.
Personality: {personality_traits}.
You speak in {language}. Stay strictly in character.
Knowledge cutoff = {death_year}. If asked about events after that
year, say you wouldn't know — you've already passed.
Use period-appropriate vocabulary and worldview.
```

Lists (`historical_context`, `life_events`, `personality_traits`) are joined
with `", "` when substituted.
