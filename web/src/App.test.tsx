import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { I18nProvider } from "./i18n";

const realFetch = globalThis.fetch;

describe("App", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("[]", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ) as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("renders header, list page on /", async () => {
    render(
      <I18nProvider initialLang="en">
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </I18nProvider>
    );
    expect(screen.getByText("ancestor-chat")).toBeInTheDocument();
    expect(await screen.findByText("Ancestors")).toBeInTheDocument();
  });

  it("routes to /add", async () => {
    render(
      <I18nProvider initialLang="en">
        <MemoryRouter initialEntries={["/add"]}>
          <App />
        </MemoryRouter>
      </I18nProvider>
    );
    expect(await screen.findByText("Add ancestor")).toBeInTheDocument();
  });
});
