import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { streamChat, type StreamEvent } from "./client";

function makeSseStream(blocks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i >= blocks.length) {
        controller.close();
        return;
      }
      controller.enqueue(enc.encode(blocks[i] + "\n\n"));
      i += 1;
    },
  });
}

describe("streamChat", () => {
  const realFetch = globalThis.fetch;
  beforeEach(() => {
    /* clear */
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("appends chunks then emits done", async () => {
    const body = makeSseStream([
      `data: {"type":"chunk","text":"Hello"}`,
      `data: {"type":"chunk","text":", world"}`,
      `data: {"type":"done"}`,
    ]);
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      })
    ) as unknown as typeof fetch;

    const events: StreamEvent[] = [];
    await streamChat("abc", "hi", (e) => events.push(e));

    await vi.waitFor(() => {
      expect(events.at(-1)).toEqual({ type: "done" });
    });

    const chunks = events
      .filter((e) => e.type === "chunk")
      .map((e) => (e as { type: "chunk"; text: string }).text)
      .join("");
    expect(chunks).toBe("Hello, world");
    expect(events.at(-1)).toEqual({ type: "done" });
  });

  it("emits error on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("nope", { status: 500, statusText: "Internal Server Error" })
    ) as unknown as typeof fetch;

    const events: StreamEvent[] = [];
    await streamChat("abc", "hi", (e) => events.push(e));

    await vi.waitFor(() => {
      expect(events.length).toBeGreaterThan(0);
    });
    expect(events[0]).toEqual({
      type: "error",
      message: "500 Internal Server Error",
    });
  });
});
