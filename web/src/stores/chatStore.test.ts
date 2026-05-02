import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useChatStore } from "./chatStore";

const realFetch = globalThis.fetch;

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function sseResponse(blocks: string[]): Response {
  const enc = new TextEncoder();
  let i = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= blocks.length) {
        controller.close();
        return;
      }
      controller.enqueue(enc.encode(blocks[i] + "\n\n"));
      i += 1;
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("chatStore", () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      streaming: "",
      isStreaming: false,
      error: null,
      handle: null,
    });
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("loadHistory populates messages", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse([
        { role: "user", content: "hi", created_at: "2026-01-01T00:00:00Z" },
        { role: "ancestor", content: "hello", created_at: "2026-01-01T00:00:01Z" },
      ])
    ) as unknown as typeof fetch;
    await useChatStore.getState().loadHistory("a1");
    expect(useChatStore.getState().messages).toHaveLength(2);
  });

  it("loadHistory captures error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("nope", { status: 500, statusText: "Server Error" })
    ) as unknown as typeof fetch;
    await useChatStore.getState().loadHistory("a1");
    expect(useChatStore.getState().error).toMatch(/500/);
  });

  it("send streams chunks then commits ancestor message on done", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      sseResponse([
        `data: {"type":"chunk","text":"He"}`,
        `data: {"type":"chunk","text":"llo"}`,
        `data: {"type":"done"}`,
      ])
    ) as unknown as typeof fetch;

    await useChatStore.getState().send("a1", "hi there");

    await vi.waitFor(() => {
      const s = useChatStore.getState();
      expect(s.isStreaming).toBe(false);
      expect(s.messages).toHaveLength(2);
    });

    const msgs = useChatStore.getState().messages;
    expect(msgs[0]).toEqual(expect.objectContaining({ role: "user", content: "hi there" }));
    expect(msgs[1]).toEqual(expect.objectContaining({ role: "ancestor", content: "Hello" }));
    expect(useChatStore.getState().streaming).toBe("");
  });

  it("send records error event", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      sseResponse([`data: {"type":"error","message":"LLM down"}`])
    ) as unknown as typeof fetch;
    await useChatStore.getState().send("a1", "ping");
    await vi.waitFor(() => {
      expect(useChatStore.getState().error).toBe("LLM down");
    });
    expect(useChatStore.getState().isStreaming).toBe(false);
  });

  it("reset clears state and cancels in-flight handle", async () => {
    const cancel = vi.fn();
    useChatStore.setState({
      messages: [
        { role: "user", content: "x", created_at: "2026-01-01T00:00:00Z" },
      ],
      streaming: "partial",
      isStreaming: true,
      handle: { cancel },
    });
    useChatStore.getState().reset();
    expect(cancel).toHaveBeenCalled();
    const s = useChatStore.getState();
    expect(s.messages).toHaveLength(0);
    expect(s.streaming).toBe("");
    expect(s.isStreaming).toBe(false);
  });
});
