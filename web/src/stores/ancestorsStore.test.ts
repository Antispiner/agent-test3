import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useAncestorsStore } from "./ancestorsStore";

const realFetch = globalThis.fetch;

function mockFetchOnce(body: unknown, init: ResponseInit = { status: 200 }) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
      ...init,
    })
  ) as unknown as typeof fetch;
}

function mockFetchError(status: number, text: string) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(text, { status, statusText: "Server Error" })
  ) as unknown as typeof fetch;
}

describe("ancestorsStore", () => {
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

  it("fetchList populates list on success", async () => {
    mockFetchOnce([
      { id: "1", name: "Anna", relation: "grandma", birth_year: 1910, death_year: 1990 },
    ]);
    await useAncestorsStore.getState().fetchList();
    const s = useAncestorsStore.getState();
    expect(s.list).toHaveLength(1);
    expect(s.list[0].name).toBe("Anna");
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
  });

  it("fetchList records error on non-2xx", async () => {
    mockFetchError(500, "boom");
    await useAncestorsStore.getState().fetchList();
    const s = useAncestorsStore.getState();
    expect(s.error).toMatch(/500/);
    expect(s.loading).toBe(false);
  });

  it("fetchOne sets current ancestor", async () => {
    mockFetchOnce({
      id: "x",
      name: "Boris",
      relation: "uncle",
      birth_year: 1900,
      death_year: 1965,
      birthplace: "Riga",
      profession: "miller",
      language: "Russian",
      life_events: [],
      personality_traits: [],
      historical_context: [],
    });
    await useAncestorsStore.getState().fetchOne("x");
    expect(useAncestorsStore.getState().current?.name).toBe("Boris");
  });

  it("fetchOne records 404 error", async () => {
    mockFetchError(404, "not found");
    await useAncestorsStore.getState().fetchOne("missing");
    const s = useAncestorsStore.getState();
    expect(s.current).toBeNull();
    expect(s.error).toMatch(/404/);
  });

  it("create appends to list and returns ancestor", async () => {
    mockFetchOnce(
      {
        id: "new-1",
        name: "Clara",
        relation: "mother",
        birth_year: 1940,
        death_year: 2020,
        birthplace: "Lviv",
        profession: "teacher",
        language: "Ukrainian",
        life_events: ["WWII"],
        personality_traits: ["kind"],
        historical_context: ["Cold War"],
      },
      { status: 201 }
    );
    const created = await useAncestorsStore.getState().create({
      name: "Clara",
      relation: "mother",
      birth_year: 1940,
      death_year: 2020,
      birthplace: "Lviv",
      profession: "teacher",
      language: "Ukrainian",
      life_events: ["WWII"],
      personality_traits: ["kind"],
      historical_context: ["Cold War"],
    });
    expect(created.id).toBe("new-1");
    const s = useAncestorsStore.getState();
    expect(s.list).toHaveLength(1);
    expect(s.list[0].id).toBe("new-1");
  });

  it("create surfaces error and rethrows", async () => {
    mockFetchError(400, "bad");
    await expect(
      useAncestorsStore.getState().create({
        name: "x",
        relation: "x",
        birth_year: 1,
        death_year: 2,
        birthplace: "x",
        profession: "x",
        language: "x",
        life_events: [],
        personality_traits: [],
        historical_context: [],
      })
    ).rejects.toThrow();
    expect(useAncestorsStore.getState().error).toMatch(/400/);
  });
});
