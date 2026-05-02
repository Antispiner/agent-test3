import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AddPage } from "./AddPage";
import { useAncestorsStore } from "../stores/ancestorsStore";

const realFetch = globalThis.fetch;

function setup() {
  return render(
    <MemoryRouter initialEntries={["/add"]}>
      <Routes>
        <Route path="/add" element={<AddPage />} />
        <Route path="/chat/:id" element={<div>chat-page-id</div>} />
        <Route path="/" element={<div>home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AddPage", () => {
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

  it("submits form, posts to /api/ancestors, and navigates to /chat/:id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "new-1",
          name: "Anna",
          relation: "grandma",
          birth_year: 1910,
          death_year: 1990,
          birthplace: "Vilnius",
          profession: "weaver",
          language: "Polish",
          life_events: ["WWI"],
          personality_traits: ["stern", "warm"],
          historical_context: ["interwar"],
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    setup();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Anna" } });
    fireEvent.change(screen.getByLabelText("Relation"), { target: { value: "grandma" } });
    fireEvent.change(screen.getByLabelText("Birth year"), { target: { value: "1910" } });
    fireEvent.change(screen.getByLabelText("Death year"), { target: { value: "1990" } });
    fireEvent.change(screen.getByLabelText("Birthplace"), { target: { value: "Vilnius" } });
    fireEvent.change(screen.getByLabelText("Profession"), { target: { value: "weaver" } });
    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "Polish" } });
    fireEvent.change(screen.getByLabelText(/^Life events/), { target: { value: "WWI" } });
    fireEvent.change(screen.getByLabelText(/^Personality traits/), {
      target: { value: "stern, warm" },
    });
    fireEvent.change(screen.getByLabelText(/^Historical context/), {
      target: { value: "interwar" },
    });

    fireEvent.click(screen.getByText("Save & open chat"));

    await waitFor(() => {
      expect(screen.getByText("chat-page-id")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ancestors",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.personality_traits).toEqual(["stern", "warm"]);
    expect(body.life_events).toEqual(["WWI"]);
    expect(body.birth_year).toBe(1910);
  });

  it("shows error when API fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("bad", { status: 400, statusText: "Bad Request" })
    ) as unknown as typeof fetch;

    setup();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Relation"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Birth year"), { target: { value: "1900" } });
    fireEvent.change(screen.getByLabelText("Death year"), { target: { value: "1980" } });
    fireEvent.change(screen.getByLabelText("Birthplace"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Profession"), { target: { value: "X" } });
    fireEvent.click(screen.getByText("Save & open chat"));

    expect(await screen.findByText(/400/)).toBeInTheDocument();
  });

  it("Cancel button navigates home", () => {
    setup();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("home")).toBeInTheDocument();
  });
});
