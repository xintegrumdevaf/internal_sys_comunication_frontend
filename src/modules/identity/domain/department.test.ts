import { describe, expect, it } from "vitest";
import { departmentVisibilityLabel } from "./department";

describe("departmentVisibilityLabel", () => {
  it("explica 'shared' en lenguaje simple, sin el término técnico", () => {
    expect(departmentVisibilityLabel("shared")).toBe("Visible para todos los agentes");
  });

  it("explica 'restricted' en lenguaje simple, sin el término técnico", () => {
    expect(departmentVisibilityLabel("restricted")).toBe("Solo agentes de esta área");
  });
});
