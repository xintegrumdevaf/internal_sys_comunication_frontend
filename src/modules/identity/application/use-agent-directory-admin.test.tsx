import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useAgentDirectoryAdmin } from "./use-agent-directory-admin";

const createAgentMock = vi.fn();
const updateAgentMock = vi.fn();
const deactivateAgentMock = vi.fn();
const resetAgentPasswordMock = vi.fn();

vi.mock("@/modules/identity/infrastructure/agent-directory.gateway", () => ({
  createAgent: (...args: unknown[]) => createAgentMock(...args),
  updateAgent: (...args: unknown[]) => updateAgentMock(...args),
  deactivateAgent: (...args: unknown[]) => deactivateAgentMock(...args),
  resetAgentPassword: (...args: unknown[]) => resetAgentPasswordMock(...args),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useAgentDirectoryAdmin", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("createAgent llama al gateway y devuelve la contraseña temporal generada por el backend", async () => {
    createAgentMock.mockResolvedValueOnce({
      agent: { id: "a1" },
      temporaryPassword: "temp-abc123",
    });
    const { result } = renderHook(() => useAgentDirectoryAdmin(), { wrapper });

    let temporaryPassword: string | null = null;
    await act(async () => {
      temporaryPassword = await result.current.createAgent({ name: "Ana", email: "ana@isp.local" });
    });

    expect(temporaryPassword).toBe("temp-abc123");
    expect(createAgentMock).toHaveBeenCalledWith({ name: "Ana", email: "ana@isp.local" });
    expect(toastSuccess).toHaveBeenCalledWith("Agente creado");
  });

  it("un error de negocio del backend (ej: email duplicado) se muestra como toast y devuelve null", async () => {
    createAgentMock.mockRejectedValueOnce(
      new Error("Ya existe un agente con el correo ana@isp.local"),
    );
    const { result } = renderHook(() => useAgentDirectoryAdmin(), { wrapper });

    let temporaryPassword: string | null = null;
    await act(async () => {
      temporaryPassword = await result.current.createAgent({ name: "Ana", email: "ana@isp.local" });
    });

    expect(temporaryPassword).toBeNull();
    expect(toastError).toHaveBeenCalledWith("Ya existe un agente con el correo ana@isp.local");
  });

  it("resetPassword devuelve la nueva contraseña temporal", async () => {
    resetAgentPasswordMock.mockResolvedValueOnce({
      agent: { id: "a1" },
      temporaryPassword: "temp-xyz789",
    });
    const { result } = renderHook(() => useAgentDirectoryAdmin(), { wrapper });

    let temporaryPassword: string | null = null;
    await act(async () => {
      temporaryPassword = await result.current.resetPassword("a1");
    });

    expect(temporaryPassword).toBe("temp-xyz789");
    expect(resetAgentPasswordMock).toHaveBeenCalledWith("a1");
  });

  it("deactivateAgent y reactivateAgent llaman al gateway correcto", async () => {
    deactivateAgentMock.mockResolvedValueOnce({ id: "a1", active: false });
    updateAgentMock.mockResolvedValueOnce({ id: "a1", active: true });
    const { result } = renderHook(() => useAgentDirectoryAdmin(), { wrapper });

    await act(async () => {
      await result.current.deactivateAgent("a1");
    });
    expect(deactivateAgentMock).toHaveBeenCalledWith("a1");

    await act(async () => {
      await result.current.reactivateAgent("a1");
    });
    expect(updateAgentMock).toHaveBeenCalledWith("a1", { active: true });
  });

  it("busy se activa mientras la acción está en curso", async () => {
    let resolvePromise!: (value: unknown) => void;
    createAgentMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );
    const { result } = renderHook(() => useAgentDirectoryAdmin(), { wrapper });

    expect(result.current.busy).toBe(false);

    let pending!: Promise<string | null>;
    act(() => {
      pending = result.current.createAgent({ name: "Ana", email: "ana@isp.local" });
    });

    await waitFor(() => expect(result.current.busy).toBe(true));

    await act(async () => {
      resolvePromise({ agent: { id: "a1" }, temporaryPassword: "temp-abc123" });
      await pending;
    });

    expect(result.current.busy).toBe(false);
  });

  it("createAgent y updateAgent propagan departmentIds y autoAssignEnabled", async () => {
    createAgentMock.mockResolvedValueOnce({
      agent: { id: "a1", departmentIds: ["d1", "d2"], autoAssignEnabled: true },
      temporaryPassword: "temp-pass",
    });
    updateAgentMock.mockResolvedValueOnce({
      id: "a1",
      departmentIds: ["d1", "d2"],
    });

    const { result } = renderHook(() => useAgentDirectoryAdmin(), { wrapper });

    await act(async () => {
      await result.current.createAgent({
        name: "Carlos",
        email: "carlos@isp.local",
        primaryDepartmentId: "d1",
        departmentIds: ["d1", "d2"],
        autoAssignEnabled: true,
      });
    });

    expect(createAgentMock).toHaveBeenCalledWith({
      name: "Carlos",
      email: "carlos@isp.local",
      primaryDepartmentId: "d1",
      departmentIds: ["d1", "d2"],
      autoAssignEnabled: true,
    });

    await act(async () => {
      await result.current.updateAgent("a1", {
        departmentIds: ["d1", "d2"],
      });
    });

    expect(updateAgentMock).toHaveBeenCalledWith("a1", {
      departmentIds: ["d1", "d2"],
    });
  });
});
