import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider, detectInitialLang } from "./index";
import { AddPage } from "../pages/AddPage";
import App from "../App";
import { LangSwitcher } from "../components/LangSwitcher";

const realFetch = globalThis.fetch;

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("i18n", () => {
  beforeEach(() => {
    window.localStorage.clear();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonRes([])) as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("renders Polish labels when initialLang=pl", () => {
    render(
      <I18nProvider initialLang="pl">
        <MemoryRouter>
          <AddPage />
        </MemoryRouter>
      </I18nProvider>
    );
    expect(screen.getByText("Imię")).toBeInTheDocument();
    expect(screen.getByText("Pokrewieństwo")).toBeInTheDocument();
    expect(screen.getByText("Zapisz i otwórz czat")).toBeInTheDocument();
    expect(screen.getByText("Anuluj")).toBeInTheDocument();
  });

  it("renders Russian labels when initialLang=ru", () => {
    render(
      <I18nProvider initialLang="ru">
        <MemoryRouter>
          <AddPage />
        </MemoryRouter>
      </I18nProvider>
    );
    expect(screen.getByText("Имя")).toBeInTheDocument();
    expect(screen.getByText("Сохранить и открыть чат")).toBeInTheDocument();
  });

  it("renders English labels when initialLang=en", () => {
    render(
      <I18nProvider initialLang="en">
        <MemoryRouter>
          <AddPage />
        </MemoryRouter>
      </I18nProvider>
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Save & open chat")).toBeInTheDocument();
  });

  it("LangSwitcher updates labels live and persists to localStorage", async () => {
    render(
      <I18nProvider initialLang="ru">
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </I18nProvider>
    );
    expect(screen.getByText("Предки")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Polski" }));

    await waitFor(() => {
      expect(screen.getByText("Przodkowie")).toBeInTheDocument();
    });
    expect(window.localStorage.getItem("ancestor.lang")).toBe("pl");

    fireEvent.click(screen.getByRole("button", { name: "English" }));
    await waitFor(() => {
      expect(screen.getByText("Ancestors")).toBeInTheDocument();
    });
    expect(window.localStorage.getItem("ancestor.lang")).toBe("en");
  });

  it("detectInitialLang returns saved value from localStorage", () => {
    window.localStorage.setItem("ancestor.lang", "pl");
    expect(detectInitialLang()).toBe("pl");
  });

  it("detectInitialLang falls back to navigator language when no storage", () => {
    window.localStorage.clear();
    Object.defineProperty(window.navigator, "language", {
      value: "ru-RU",
      configurable: true,
    });
    expect(detectInitialLang()).toBe("ru");
  });

  it("detectInitialLang defaults to ru when navigator lang unsupported", () => {
    window.localStorage.clear();
    Object.defineProperty(window.navigator, "language", {
      value: "fr-FR",
      configurable: true,
    });
    expect(detectInitialLang()).toBe("ru");
  });

  it("detectInitialLang ignores unsupported saved lang", () => {
    window.localStorage.setItem("ancestor.lang", "zz");
    Object.defineProperty(window.navigator, "language", {
      value: "en-US",
      configurable: true,
    });
    expect(detectInitialLang()).toBe("en");
  });

  it("LangSwitcher has aria-pressed for active button", () => {
    render(
      <I18nProvider initialLang="pl">
        <LangSwitcher />
      </I18nProvider>
    );
    const pl = screen.getByRole("button", { name: "Polski" });
    expect(pl).toHaveAttribute("aria-pressed", "true");
    const en = screen.getByRole("button", { name: "English" });
    expect(en).toHaveAttribute("aria-pressed", "false");
  });
});
