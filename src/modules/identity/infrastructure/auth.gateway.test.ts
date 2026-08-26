import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { changePassword, fetchCurrentAgent, login, logout } from "./auth.gateway";

function mockFetchOnce(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: "",
    text: () => Promise.resolve(JSON.stringify(status < 400 ? { data: body } : { error: body })),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("auth.gateway", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("login hace POST a /api/auth/login con credentials include", async () => {
    const fetchMock = mockFetchOnce(200, { id: "a1", name: "Ana" });
    const agent = await login("ana@isp.local", "secreta123");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/auth/login");
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("include");
    expect(JSON.parse(init?.body as string)).toEqual({
      email: "ana@isp.local",
      password: "secreta123",
    });
    expect(agent.name).toBe("Ana");
  });

  it("logout hace POST a /api/auth/logout", async () => {
    const fetchMock = mockFetchOnce(204, undefined);
    await logout();
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("http://localhost:3000/api/auth/logout");
  });

  it("fetchCurrentAgent devuelve el agente cuando hay sesion", async () => {
    mockFetchOnce(200, { id: "a1", name: "Ana" });
    const agent = await fetchCurrentAgent();
    expect(agent?.name).toBe("Ana");
  });

  it("fetchCurrentAgent devuelve null en vez de lanzar cuando no hay sesion (403)", async () => {
    mockFetchOnce(403, { type: "AUTHORIZATION_ERROR", message: "Debes iniciar sesion" });
    const agent = await fetchCurrentAgent();
    expect(agent).toBeNull();
  });

  it("changePassword hace POST a /api/auth/change-password", async () => {
    const fetchMock = mockFetchOnce(204, undefined);
    await changePassword("actual123", "nueva12345");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/auth/change-password");
    expect(JSON.parse(init?.body as string)).toEqual({
      currentPassword: "actual123",
      newPassword: "nueva12345",
    });
  });
});
