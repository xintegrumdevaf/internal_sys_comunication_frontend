import { describe, expect, it } from "vitest";
import { departmentVisibilityLabel, departmentHandlingModeLabel } from "./department";

describe("departmentVisibilityLabel", () => {
  it("explica 'shared' en lenguaje simple, sin el término técnico", () => {
    expect(departmentVisibilityLabel("shared")).toBe("Visible para todos los agentes");
  });

  it("explica 'restricted' en lenguaje simple, sin el término técnico", () => {
    expect(departmentVisibilityLabel("restricted")).toBe("Solo agentes de esta área");
  });
});

describe("departmentHandlingModeLabel", () => {
  it("describe 'ai_assisted' como Asistido por IA", () => {
    expect(departmentHandlingModeLabel("ai_assisted")).toBe("Asistido por IA");
  });

  it("describe 'human_direct' como Transferencia Directa a Humano", () => {
    expect(departmentHandlingModeLabel("human_direct")).toBe("Transferencia Directa a Humano");
  });
});
