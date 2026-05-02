import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageRow } from "./MessageRow";

describe("MessageRow", () => {
  const base = {
    role: "user" as const,
    content: "hello world",
    created_at: "2026-05-03T12:00:00Z",
  };

  it("renders user message with blue badge and content", () => {
    render(<MessageRow message={base} />);
    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(screen.getByText("user")).toBeInTheDocument();
  });

  it("renders ancestor message with purple badge", () => {
    render(<MessageRow message={{ ...base, role: "ancestor", content: "I lived" }} />);
    expect(screen.getByText("ancestor")).toBeInTheDocument();
    expect(screen.getByText("I lived")).toBeInTheDocument();
  });

  it("shows pulsing caret while streaming", () => {
    const { container } = render(<MessageRow message={base} streaming />);
    const caret = container.querySelector(".animate-pulse");
    expect(caret).not.toBeNull();
    expect(caret?.textContent).toBe("▌");
  });

  it("hides caret when not streaming", () => {
    const { container } = render(<MessageRow message={base} />);
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });

  it("survives invalid date", () => {
    render(<MessageRow message={{ ...base, created_at: "not-a-date" }} />);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });
});
