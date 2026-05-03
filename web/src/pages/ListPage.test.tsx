import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ListPage } from "./ListPage";
import { useAncestorsStore } from "../stores/ancestorsStore";
import { I18nProvider } from "../i18n";

const realFetch = globalThis.fetch;

describe("ListPage", () => {
  beforeEach(() => {
    useAncestorsStore.setState({
      list: [],
      current: null,
      loading: false,
      error: null,
    });
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("renders empty state when no ancestors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("[]", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ) as unknown as typeof fetch;
    render(
      <I18nProvider initialLang="en">
        <MemoryRouter>
          <ListPage />
        </MemoryRouter>
      </I18nProvider>
    );
    expect(await screen.findByText(/No ancestors yet\./)).toBeInTheDocument();
    expect(screen.getByText("+ Add ancestor")).toBeInTheDocument();
  });

  it("renders cards when list is populated", async () => {
    useAncestorsStore.setState({
      list: [
        { id: "1", name: "Anna", relation: "grandma", birth_year: 1910, death_year: 1990 },
        { id: "2", name: "Boris", relation: "uncle", birth_year: 1900, death_year: 1965 },
      ],
    });
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })
    ) as unknown as typeof fetch;
    render(
      <I18nProvider initialLang="en">
        <MemoryRouter>
          <ListPage />
        </MemoryRouter>
      </I18nProvider>
    );
    expect(screen.getByText("Anna")).toBeInTheDocument();
    expect(screen.getByText("Boris")).toBeInTheDocument();
  });

  it("shows error banner on fetch failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("oops", { status: 500, statusText: "Server Error" })
    ) as unknown as typeof fetch;
    render(
      <I18nProvider initialLang="en">
        <MemoryRouter>
          <ListPage />
        </MemoryRouter>
      </I18nProvider>
    );
    expect(await screen.findByText(/500/)).toBeInTheDocument();
  });
});
