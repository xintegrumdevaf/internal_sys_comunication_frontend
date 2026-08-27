import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  listMessageTemplates,
  listWabaConnections,
} from "./message-template.gateway";

function mockFetchOnce(data: unknown = []) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "",
    text: () => Promise.resolve(JSON.stringify({ data })),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("message-template.gateway", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("listMessageTemplates envía parámetros de búsqueda y mapea la respuesta envelope { templates: [...] }", async () => {
    const fetchMock = mockFetchOnce({
      templates: [
        {
          id: "tpl_123",
          name: "bienvenida_cliente",
          category: "MARKETING",
          language: "es",
          connectionId: "default",
          headerType: "NONE",
          headerContent: null,
          bodyText: "Hola {{1}}",
          footerText: "Salir",
          buttons: null,
          status: "APPROVED",
          metaTemplateId: "123456",
          createdAt: "2026-08-27T14:00:00.000Z",
        },
      ],
      total: 1,
    });

    const result = await listMessageTemplates({
      query: "bienvenida",
      category: "MARKETING",
      status: "APPROVED",
      agentUserId: "user_1",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);

    expect(parsed.pathname).toBe("/api/message-templates");
    expect(parsed.searchParams.get("search")).toBe("bienvenida");
    expect(parsed.searchParams.get("category")).toBe("MARKETING");
    expect(parsed.searchParams.get("status")).toBe("APPROVED");
    expect((init.headers as Record<string, string>)["x-agent-id"]).toBe("user_1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tpl_123");
    expect(result[0].body).toBe("Hola {{1}}");
    expect(result[0].variables).toEqual(["1"]);
  });

  it("createMessageTemplate transforma el payload del frontend al contrato DTO del backend", async () => {
    const fetchMock = mockFetchOnce({
      id: "tpl_new",
      name: "notificacion_pago",
      category: "UTILITY",
      language: "es",
      connectionId: "default",
      headerType: "TEXT",
      headerContent: "Aviso de Pago",
      bodyText: "Estimado {{1}}, su factura de {{2}} está disponible.",
      footerText: "Soporte ISP",
      buttons: [{ type: "URL", text: "Ver Factura", url: "https://isp.example.com/pay" }],
      status: "PENDING",
      createdAt: "2026-08-27T14:10:00.000Z",
    });

    const payload = {
      name: "notificacion_pago",
      category: "UTILITY" as const,
      language: "es",
      connectionId: "default",
      header: { type: "TEXT" as const, text: "Aviso de Pago" },
      body: "Estimado {{1}}, su factura de {{2}} está disponible.",
      footer: "Soporte ISP",
      buttons: [{ type: "CALL_TO_ACTION" as const, text: "Ver Factura", url: "https://isp.example.com/pay" }],
    };

    const res = await createMessageTemplate(payload, "user_1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/message-templates");
    expect(init.method).toBe("POST");

    const sentBody = JSON.parse(init.body as string);
    expect(sentBody).toEqual({
      name: "notificacion_pago",
      category: "UTILITY",
      language: "es",
      connectionId: "default",
      headerType: "TEXT",
      headerContent: "Aviso de Pago",
      bodyText: "Estimado {{1}}, su factura de {{2}} está disponible.",
      footerText: "Soporte ISP",
      buttons: [{ type: "URL", text: "Ver Factura", url: "https://isp.example.com/pay", phoneNumber: undefined }],
    });

    expect(res.id).toBe("tpl_new");
    expect(res.status).toBe("PENDING");
    expect(res.variables).toEqual(["1", "2"]);
  });

  it("deleteMessageTemplate realiza la petición DELETE al id especificado", async () => {
    const fetchMock = mockFetchOnce({ success: true, id: "tpl_123" });
    await deleteMessageTemplate("tpl_123", "user_1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/message-templates/tpl_123");
    expect(init.method).toBe("DELETE");
  });

  it("listWabaConnections retorna la conexión por defecto para el backend de número único", async () => {
    const connections = await listWabaConnections("user_1");
    expect(connections).toHaveLength(1);
    expect(connections[0].id).toBe("default");
    expect(connections[0].name).toBe("Línea Oficial WhatsApp");
  });
});
