import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { knowledgeService } from "./knowledge.service";

describe("knowledgeService", () => {
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

  it("getDocuments hace GET a /api/rag/documents sin filtro", async () => {
    const mockDocs = [{ id: "doc-1", name: "Guia.pdf", category: "General" }];
    const fetchMock = mockFetchOnce(mockDocs);

    const result = await knowledgeService.getDocuments();

    expect(result).toEqual(mockDocs);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/rag/documents");
  });

  it("getDocuments hace GET con query param departmentId cuando se especifica", async () => {
    const mockDocs = [{ id: "doc-2", name: "Manual_Soporte.pdf", departmentId: "dept-123" }];
    const fetchMock = mockFetchOnce(mockDocs);

    const result = await knowledgeService.getDocuments("dept-123");

    expect(result).toEqual(mockDocs);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/rag/documents?departmentId=dept-123");
  });

  it("uploadDocument envía FormData con file, category, departmentId e isGlobal", async () => {
    const mockResponse = { id: "doc-3", name: "Politicas.pdf", isGlobal: true };
    const fetchMock = mockFetchOnce(mockResponse);

    const file = new File(["contenido"], "Politicas.pdf", { type: "application/pdf" });
    const result = await knowledgeService.uploadDocument(
      file,
      "Políticas Generales",
      "dept-99",
      true,
    );

    expect(result).toEqual(mockResponse);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/rag/documents");
    expect(init?.method).toBe("POST");

    const formData = init?.body as FormData;
    expect(formData.get("category")).toBe("Políticas Generales");
    expect(formData.get("departmentId")).toBe("dept-99");
    expect(formData.get("isGlobal")).toBe("true");
  });

  it("getFaqs hace GET a /api/rag/faqs con y sin departmentId", async () => {
    const fetchMock = mockFetchOnce([]);
    await knowledgeService.getFaqs("dept-456");

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/rag/faqs?departmentId=dept-456");
  });

  it("saveFaq hace POST a /api/rag/faqs para nueva FAQ y PUT para actualizar", async () => {
    const postMock = mockFetchOnce({ id: "faq-1", question: "¿Horario?", isGlobal: true });
    await knowledgeService.saveFaq({
      question: "¿Horario?",
      answer: "8am a 6pm",
      category: "General",
      isGlobal: true,
      departmentId: null,
      tags: ["horario"],
      variations: [],
      active: true,
    });

    const [postUrl, postInit] = postMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(postUrl).toBe("http://localhost:3000/api/rag/faqs");
    expect(postInit?.method).toBe("POST");

    const putMock = mockFetchOnce({ id: "faq-1", question: "¿Horario actualizado?" });
    await knowledgeService.saveFaq({
      id: "faq-1",
      question: "¿Horario actualizado?",
      answer: "8am a 8pm",
      category: "General",
      isGlobal: true,
      departmentId: null,
      tags: [],
      variations: [],
      active: true,
    });

    const [putUrl, putInit] = putMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(putUrl).toBe("http://localhost:3000/api/rag/faqs/faq-1");
    expect(putInit?.method).toBe("PUT");
  });

  it("queryRag envía departmentId opcional en el body", async () => {
    const mockRagRes = {
      answer: "Reinicia el equipo desconectando la fuente.",
      found: true,
      confidenceScore: 0.95,
      sources: ["Manual.pdf"],
      retrievedChunks: [],
      executionTimeMs: 250,
    };
    const fetchMock = mockFetchOnce(mockRagRes);

    const result = await knowledgeService.queryRag({
      question: "¿Cómo reiniciar router?",
      departmentId: "dept-soporte",
    });

    expect(result).toEqual(mockRagRes);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/rag/query");
    expect(JSON.parse(init?.body as string)).toEqual({
      question: "¿Cómo reiniciar router?",
      departmentId: "dept-soporte",
    });
  });
});
