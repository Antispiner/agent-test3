export interface AncestorInput {
  name: string;
  relation: string;
  birth_year: number;
  death_year: number;
  birthplace: string;
  profession: string;
  language: string;
  life_events: string[];
  personality_traits: string[];
  historical_context: string[];
  photo_url?: string;
}

export interface Ancestor extends AncestorInput {
  id: string;
}

export interface AncestorListItem {
  id: string;
  name: string;
  relation: string;
  birth_year?: number;
  death_year?: number;
}

export interface ChatMessage {
  role: "user" | "ancestor";
  content: string;
  created_at: string;
}

export type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

const BASE = "/api";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status} ${res.statusText}${detail ? ": " + detail : ""}`);
  }
  return (await res.json()) as T;
}

export async function listAncestors(): Promise<AncestorListItem[]> {
  const res = await fetch(`${BASE}/ancestors`);
  return jsonOrThrow<AncestorListItem[]>(res);
}

export async function getAncestor(id: string): Promise<Ancestor> {
  const res = await fetch(`${BASE}/ancestors/${id}`);
  return jsonOrThrow<Ancestor>(res);
}

export async function createAncestor(body: AncestorInput): Promise<Ancestor> {
  const res = await fetch(`${BASE}/ancestors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow<Ancestor>(res);
}

export async function deleteAncestor(id: string): Promise<void> {
  const res = await fetch(`${BASE}/ancestors/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
}

export async function getChatHistory(id: string): Promise<ChatMessage[]> {
  const res = await fetch(`${BASE}/chat/${id}/messages`);
  return jsonOrThrow<ChatMessage[]>(res);
}

export interface StreamHandle {
  cancel: () => void;
}

export async function streamChat(
  id: string,
  message: string,
  onEvent: (e: StreamEvent) => void
): Promise<StreamHandle> {
  const ctrl = new AbortController();
  const handle: StreamHandle = { cancel: () => ctrl.abort() };

  (async () => {
    try {
      const res = await fetch(`${BASE}/chat/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ message }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        onEvent({ type: "error", message: `${res.status} ${res.statusText}` });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          parseSseAndEmit(ev, onEvent);
        }
      }
      if (buf.trim()) parseSseAndEmit(buf, onEvent);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      onEvent({ type: "error", message: (err as Error).message });
    }
  })();

  return handle;
}

function parseSseAndEmit(block: string, onEvent: (e: StreamEvent) => void) {
  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload) continue;
    try {
      const ev = JSON.parse(payload) as StreamEvent;
      onEvent(ev);
    } catch {
      onEvent({ type: "error", message: `bad SSE payload: ${payload}` });
    }
  }
}
