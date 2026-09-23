import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { promptService } from "./prompt.service";

describe("promptService", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function mockFetchOnce(body: unknown, status = 200) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: "",
      text: () => Promise.resolve(JSON.stringify({ data: body })),
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("listPrompts hace GET a /api/prompts", async () => {
    const mockPrompts = [
      {
        id: "p-1",
        slug: "interpret_message",
        name: "Clasificación NLU",
        description: "Clasifica mensajes",
        allowedVariables: ["message"],
        versionsCount: 2,
      },
    ];
    const fetchMock = mockFetchOnce(mockPrompts);

    const result = await promptService.listPrompts();

    expect(result).toEqual(mockPrompts);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/prompts");
  });

  it("getPromptBySlug hace GET a /api/prompts/:slug", async () => {
    const mockDetail = {
      id: "p-1",
      slug: "interpret_message",
      name: "Clasificación NLU",
      versions: [],
    };
    const fetchMock = mockFetchOnce(mockDetail);

    const result = await promptService.getPromptBySlug("interpret_message");

    expect(result).toEqual(mockDetail);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/prompts/interpret_message");
  });

  it("createVersion hace POST a /api/prompts/:slug/versions", async () => {
    const mockVersion = {
      id: "v-2",
      versionNumber: 2,
      systemPrompt: "Eres un asistente...",
      userTemplate: "{{message}}",
    };
    const fetchMock = mockFetchOnce(mockVersion);

    const result = await promptService.createVersion("interpret_message", {
      systemPrompt: "Eres un asistente...",
      userTemplate: "{{message}}",
      changeNotes: "Prueba",
      publishImmediately: true,
    });

    expect(result).toEqual(mockVersion);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/prompts/interpret_message/versions");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      systemPrompt: "Eres un asistente...",
      userTemplate: "{{message}}",
      changeNotes: "Prueba",
      publishImmediately: true,
    });
  });

  it("publishVersion hace POST a /api/prompts/:slug/publish con versionId", async () => {
    const fetchMock = mockFetchOnce(null);

    await promptService.publishVersion("interpret_message", "v-99");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/prompts/interpret_message/publish");
    expect(JSON.parse(init?.body as string)).toEqual({ versionId: "v-99" });
  });

  it("rollbackVersion hace POST a /api/prompts/:slug/rollback con o sin targetVersionId", async () => {
    const fetchMock = mockFetchOnce(null);

    await promptService.rollbackVersion("interpret_message");
    const [url1, init1] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url1).toBe("http://localhost:3000/api/prompts/interpret_message/rollback");
    expect(JSON.parse(init1?.body as string)).toEqual({});

    await promptService.rollbackVersion("interpret_message", "v-target");
    const [url2, init2] = fetchMock.mock.calls[1] as [string, RequestInit | undefined];
    expect(url2).toBe("http://localhost:3000/api/prompts/interpret_message/rollback");
    expect(JSON.parse(init2?.body as string)).toEqual({ targetVersionId: "v-target" });
  });

  it("simulatePrompt hace POST a /api/prompts/:slug/simulate", async () => {
    const mockSimResult = {
      interpolatedSystem: "Eres un bot",
      interpolatedUser: "Hola",
      rawResponse: '{"intent":"greeting"}',
      isValidJson: true,
      durationMs: 180,
    };
    const fetchMock = mockFetchOnce(mockSimResult);

    const result = await promptService.simulatePrompt("interpret_message", {
      systemPrompt: "Eres un bot",
      userTemplate: "{{message}}",
      testVariables: { message: "Hola" },
    });

    expect(result).toEqual(mockSimResult);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/prompts/interpret_message/simulate");
  });
});
