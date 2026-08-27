import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StateDiffViewer } from "./StateDiffViewer";

describe("StateDiffViewer", () => {
  it("muestra mensaje cuando no hay estado anterior ni nuevo", () => {
    render(<StateDiffViewer before={null} after={null} />);
    expect(screen.getByText(/Sin cambios de estado registrados/i)).toBeInTheDocument();
  });

  it("renderiza claves y diferencias entre estado anterior y nuevo", () => {
    const before = { status: "pending", priority: "low" };
    const after = { status: "completed", priority: "low" };

    render(<StateDiffViewer before={before} after={after} />);

    expect(screen.getByText(/Estado Anterior/i)).toBeInTheDocument();
    expect(screen.getByText(/Estado Nuevo/i)).toBeInTheDocument();
    expect(screen.getAllByText(/status:/i)).toHaveLength(2);
    expect(screen.getByText(/"pending"/i)).toBeInTheDocument();
    expect(screen.getByText(/"completed"/i)).toBeInTheDocument();
  });
});
