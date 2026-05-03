import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ChatPage } from "./ChatPage";
import { useAncestorsStore } from "../stores/ancestorsStore";
import { useChatStore } from "../stores/chatStore";
import { I18nProvider } from "../i18n";

const realFetch = globalThis.fetch;

function setup(id = "a1") {
  return render(
    <I18nProvider initialLang="en">
      <MemoryRouter initialEntries={[`/chat/${id}`]}>
        <Routes>
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>
  );
}

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sseRes(blocks: string[]): Response {
  const enc = new TextEncoder();
  let i = 0;
  return new Response(
    new ReadableStream<Uint8Array>({
      pull(c) {
        if (i >= blocks.length) {
          c.close();
          return;
        }
        c.enqueue(enc.encode(blocks[i] + "\n\n"));
        i += 1;
      },
    }),
    { status: 200, headers: { "Content-Type": "text/event-stream" } }
  );
}

describe("ChatPage", () => {
  beforeEach(() => {
    useAncestorsStore.setState({
      list: [],
      current: null,
      loading: false,
      error: null,
    });
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

  it("loads ancestor + history and renders header", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/messages")) {
        return Promise.resolve(
          jsonRes([
            { role: "user", content: "hi", created_at: "2026-01-01T00:00:00Z" },
            { role: "ancestor", content: "hello, child", created_at: "2026-01-01T00:00:01Z" },
          ])
        );
      }
      return Promise.resolve(
        jsonRes({
          id: "a1",
          name: "Anna",
          relation: "grandma",
          birth_year: 1910,
          death_year: 1990,
          birthplace: "Vilnius",
          profession: "weaver",
          language: "Polish",
          life_events: [],
          personality_traits: [],
          historical_context: [],
        })
      );
    }) as unknown as typeof fetch;

    setup();

    expect(await screen.findByText("Anna")).toBeInTheDocument();
    expect(await screen.findByText("1910-1990")).toBeInTheDocument();
    expect(await screen.findByText("hello, child")).toBeInTheDocument();
  });

  it("send button posts and streams response into chat", async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      calls += 1;
      if (url.includes("/messages")) return Promise.resolve(jsonRes([]));
      if (init?.method === "POST") {
        return Promise.resolve(
          sseRes([
            `data: {"type":"chunk","text":"Greetings"}`,
            `data: {"type":"chunk","text":" young one"}`,
            `data: {"type":"done"}`,
          ])
        );
      }
      return Promise.resolve(
        jsonRes({
          id: "a1",
          name: "Anna",
          relation: "grandma",
          birth_year: 1910,
          death_year: 1990,
          birthplace: "Vilnius",
          profession: "weaver",
          language: "Polish",
          life_events: [],
          personality_traits: [],
          historical_context: [],
        })
      );
    }) as unknown as typeof fetch;

    setup();
    await screen.findByText("Anna");

    fireEvent.change(screen.getByPlaceholderText("Ask your ancestor..."), {
      target: { value: "Tell me a story" },
    });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(screen.getByText("Tell me a story")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("Greetings young one")).toBeInTheDocument();
    });
    expect(calls).toBeGreaterThanOrEqual(3);
  });

  it("shows empty-state copy when no messages", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/messages")) return Promise.resolve(jsonRes([]));
      return Promise.resolve(
        jsonRes({
          id: "a1",
          name: "Solo",
          relation: "mentor",
          birth_year: 1900,
          death_year: 1970,
          birthplace: "Lviv",
          profession: "scholar",
          language: "Ukrainian",
          life_events: [],
          personality_traits: [],
          historical_context: [],
        })
      );
    }) as unknown as typeof fetch;
    setup();
    expect(
      await screen.findByText(/No messages yet\./)
    ).toBeInTheDocument();
  });
});
