import { afterEach, describe, expect, it, vi } from "vitest";
import { getApiBaseUrl, resolveApiUrl } from "./api-base";

/**
 * Reemplaza al antiguo script manual `lib/api-base.check.ts` — mismas
 * aserciones, ahora como parte del runner de tests (docs/skills/testing-strategy-frontend.md).
 * `vi.stubEnv` parchea tanto `process.env` como `import.meta.env` (getApiBaseUrl lee ambos).
 */
describe("api-base", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normaliza la URL base quitando el slash final", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000/");
    expect(getApiBaseUrl()).toBe("http://localhost:3000");
  });

  it("lanza si VITE_API_BASE_URL no está configurada", () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    expect(() => getApiBaseUrl()).toThrow(/VITE_API_BASE_URL/);
  });

  it("resuelve rutas absolutas contra la base", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
    expect(resolveApiUrl("/api/media/m1")).toBe("http://localhost:3000/api/media/m1");
  });

  it("agrega el slash inicial si falta", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
    expect(resolveApiUrl("api/departments")).toBe("http://localhost:3000/api/departments");
  });

  it("no toca URLs ya absolutas (http/https)", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
    expect(resolveApiUrl("https://cdn.example/x")).toBe("https://cdn.example/x");
  });
});
