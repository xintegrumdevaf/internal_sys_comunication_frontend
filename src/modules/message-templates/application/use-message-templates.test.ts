import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMessageTemplates } from "./use-message-templates";
import type { SessionUser } from "@/modules/identity/domain/session";

const listMessageTemplatesMock = vi.fn();
const createMessageTemplateMock = vi.fn();
const deleteMessageTemplateMock = vi.fn();
const listWabaConnectionsMock = vi.fn();

vi.mock("@/modules/message-templates/infrastructure/message-template.gateway", () => ({
  listMessageTemplates: (...args: unknown[]) => listMessageTemplatesMock(...args),
  createMessageTemplate: (...args: unknown[]) => createMessageTemplateMock(...args),
  deleteMessageTemplate: (...args: unknown[]) => deleteMessageTemplateMock(...args),
  listWabaConnections: (...args: unknown[]) => listWabaConnectionsMock(...args),
}));

const mockSession: SessionUser = {
  id: "admin_1",
  name: "Administrador XGO",
  initials: "AX",
  email: "admin@xgo.com",
  role: "admin",
  active: true,
  primaryDepartmentId: "dept_admin",
  departmentIds: ["dept_admin"],
  departmentSlug: "admin",
  departmentName: "Administración",
  roleLabel: "Administrador General",
  autoAssignEnabled: false,
  mustChangePassword: false,
  landing: "/",
};

vi.mock("@/modules/identity/application/use-session", () => ({
  useSession: () => mockSession,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("useMessageTemplates", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("inicializa el hook y carga plantillas y conexiones al montar", async () => {
    listMessageTemplatesMock.mockResolvedValueOnce([
      {
        id: "tpl_100",
        name: "test_template",
        category: "UTILITY",
        language: "es",
        connectionId: "waba_1",
        connectionName: "Conexión Test",
        status: "APPROVED",
        body: "Hola mundo",
        variables: [],
        createdAt: "2026-08-27T10:00:00Z",
      },
    ]);
    listWabaConnectionsMock.mockResolvedValueOnce([
      { id: "waba_1", name: "Conexión Test", status: "active" },
    ]);

    const { result } = renderHook(() => useMessageTemplates({ pausePolling: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].name).toBe("test_template");
    expect(result.current.connections).toHaveLength(1);
  });

  it("aplica filtros de búsqueda y categoría correctamente", async () => {
    listMessageTemplatesMock.mockResolvedValue([
      { id: "1", name: "pago_aviso", category: "UTILITY", body: "a", status: "APPROVED" },
      { id: "2", name: "promo_verano", category: "MARKETING", body: "b", status: "APPROVED" },
    ]);
    listWabaConnectionsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useMessageTemplates({ pausePolling: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.templates).toHaveLength(2);

    act(() => {
      result.current.setFilters((f) => ({ ...f, category: "MARKETING" }));
    });

    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].name).toBe("promo_verano");
  });

  it("createTemplate valida el nombre antes de enviar", async () => {
    listMessageTemplatesMock.mockResolvedValueOnce([]);
    listWabaConnectionsMock.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useMessageTemplates({ pausePolling: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let success = false;
    await act(async () => {
      success = await result.current.createTemplate({
        name: "Nombre Invalido",
        category: "UTILITY",
        language: "es",
        connectionId: "waba_1",
        body: "Hola",
      });
    });

    expect(success).toBe(false);
    expect(createMessageTemplateMock).not.toHaveBeenCalled();
  });

  it("deleteTemplate remueve la plantilla del estado", async () => {
    listMessageTemplatesMock
      .mockResolvedValueOnce([
        { id: "tpl_del", name: "eliminar_me", category: "UTILITY", body: "x", status: "APPROVED" },
      ])
      .mockResolvedValue([]);
    listWabaConnectionsMock.mockResolvedValue([]);
    deleteMessageTemplateMock.mockResolvedValueOnce({ success: true, id: "tpl_del" });

    const { result } = renderHook(() => useMessageTemplates({ pausePolling: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.templates).toHaveLength(1);

    await act(async () => {
      await result.current.deleteTemplate("tpl_del");
    });

    expect(result.current.templates).toHaveLength(0);
  });
});
