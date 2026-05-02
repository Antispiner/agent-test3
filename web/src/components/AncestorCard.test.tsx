import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AncestorCard } from "./AncestorCard";

describe("AncestorCard", () => {
  it("renders name, dates and relation", () => {
    render(
      <MemoryRouter>
        <AncestorCard
          ancestor={{
            id: "abc-123",
            name: "Iván Petrov",
            relation: "great-grandfather",
            birth_year: 1888,
            death_year: 1962,
          }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("Iván Petrov")).toBeInTheDocument();
    expect(screen.getByText("1888-1962")).toBeInTheDocument();
    expect(screen.getByText("great-grandfather")).toBeInTheDocument();
    expect(screen.getByTestId("ancestor-card")).toHaveAttribute(
      "href",
      "/chat/abc-123"
    );
  });

  it("hides date badge when years missing", () => {
    render(
      <MemoryRouter>
        <AncestorCard
          ancestor={{
            id: "x",
            name: "Unknown",
            relation: "ancestor",
          }}
        />
      </MemoryRouter>
    );
    expect(screen.queryByText(/\d{4}-\d{4}/)).toBeNull();
  });
});
