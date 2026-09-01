import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCaseActions } from "./use-case-actions";
import type { SessionUser } from "@/modules/identity/domain/session";

const claimCaseMock = vi.fn();
const assignCaseMock = vi.fn();

vi.mock("@/modules/cases/infrastructure/case.gateway", () => ({
  claimCase: (...args: unknown[]) => claimCaseMock(...args),
  assignCase: (...args: unknown[]) => assignCaseMock(...args),
  reassignCase: vi.fn(),
  completeCase: vi.fn(),
  cancelCase: vi.fn(),
  transferCase: vi.fn(),
  disableAutomation: vi.fn(),
  reactivateAutomation: vi.fn(),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const session: SessionUser = {
  id: "agent_1",
  name: "Laura Mendoza",
  initials: "LM",
  email: "laura@isp.local",
  role: "agent",
  active: true,
  primaryDepartmentId: "dept_support",
  departmentIds: ["dept_support"],
  departmentSlug: "support",
  departmentName: "Soporte técnico",
  roleLabel: "Agente · Soporte técnico",
  autoAssignEnabled: false,
  mustChangePassword: false,
  landing: "/bandeja",
};

describe("useCaseActions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("claim llama al gateway con el caseId y el agentUserId de la sesión, y notifica éxito", async () => {
    claimCaseMock.mockResolvedValueOnce(undefined);
    const onChanged = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useCaseActions(session, onChanged));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.claim("case_1");
    });

    expect(ok).toBe(true);
    expect(claimCaseMock).toHaveBeenCalledWith("case_1", "agent_1");
    expect(toastSuccess).toHaveBeenCalledWith("Caso reclamado");
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("sin sesión, ninguna acción llama al gateway (evita operar sin identidad real)", async () => {
    const { result } = renderHook(() => useCaseActions(null));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.claim("case_1");
    });

    expect(ok).toBe(false);
    expect(claimCaseMock).not.toHaveBeenCalled();
  });

  it("un fallo del gateway se refleja como toast de error, no como excepción sin manejar", async () => {
    assignCaseMock.mockRejectedValueOnce(new Error("403 Forbidden"));
    const { result } = renderHook(() => useCaseActions(session));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.assign("case_1", "agent_2");
    });

    expect(ok).toBe(false);
    expect(toastError).toHaveBeenCalledWith("403 Forbidden");
  });

  it("busy se activa mientras la acción está en curso y se apaga al terminar", async () => {
    let resolvePromise!: () => void;
    claimCaseMock.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolvePromise = resolve;
      }),
    );
    const { result } = renderHook(() => useCaseActions(session));

    expect(result.current.busy).toBe(false);

    let pending!: Promise<boolean>;
    act(() => {
      pending = result.current.claim("case_1");
    });

    await waitFor(() => expect(result.current.busy).toBe(true));

    await act(async () => {
      resolvePromise();
      await pending;
    });

    expect(result.current.busy).toBe(false);
  });
});
