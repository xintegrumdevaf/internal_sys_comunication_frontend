import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEscalations } from "./use-escalations";
import type { EscalationDto } from "@/modules/escalations/domain/escalation";
import type { SessionUser } from "@/modules/identity/domain/session";

const listEscalationsMock = vi.fn();
vi.mock("@/modules/escalations/infrastructure/escalation.gateway", () => ({
  listEscalations: (...args: unknown[]) => listEscalationsMock(...args),
}));

const getCaseSummaryMock = vi.fn();
const getCaseTimelineMock = vi.fn();
const claimCaseMock = vi.fn();
vi.mock("@/modules/cases/infrastructure/case.gateway", () => ({
  getCaseSummary: (...args: unknown[]) => getCaseSummaryMock(...args),
  getCaseTimeline: (...args: unknown[]) => getCaseTimelineMock(...args),
  claimCase: (...args: unknown[]) => claimCaseMock(...args),
  assignCase: vi.fn(),
  reassignCase: vi.fn(),
  completeCase: vi.fn(),
  cancelCase: vi.fn(),
  transferCase: vi.fn(),
  disableAutomation: vi.fn(),
  reactivateAutomation: vi.fn(),
}));

const session: SessionUser = {
  id: "manager_1",
  name: "Camila Ortiz",
  initials: "CO",
  email: "camila@isp.local",
  role: "manager",
  active: true,
  primaryDepartmentId: "dept_support",
  departmentSlug: "support",
  departmentName: "Soporte técnico",
  roleLabel: "Jefe de área · Soporte técnico",
  autoAssignEnabled: false,
  landing: "/",
};

vi.mock("@/modules/identity/application/use-session", () => ({
  useSession: () => session,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeEscalation(overrides: Partial<EscalationDto> = {}): EscalationDto {
  return {
    id: "esc_1",
    caseId: "case_1",
    departmentId: "dept_support",
    priority: "normal",
    reason: "Diagnóstico no resoluble automáticamente",
    summary: {
      problem: "x",
      workflow: "SUPPORT_INTERNET",
      department: "support",
      status: "ESCALATED",
      reason: "x",
      completedSteps: [],
      results: {},
      pendingAction: "Intervención humana",
      timeline: [],
    },
    status: "PENDING",
    assignedAgentId: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    ...overrides,
  };
}

describe("useEscalations", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("carga escalaciones al montar, con el agentUserId de la sesión", async () => {
    listEscalationsMock.mockResolvedValueOnce([makeEscalation()]);
    const { result } = renderHook(() => useEscalations());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(listEscalationsMock).toHaveBeenCalledWith({
      agentUserId: "manager_1",
      departmentId: undefined,
      status: undefined,
      triage: false,
    });
    expect(result.current.escalations).toHaveLength(1);
  });

  it("cambiar triage recarga con departmentId=null implícito vía el gateway", async () => {
    listEscalationsMock.mockResolvedValue([]);
    const { result } = renderHook(() => useEscalations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setTriage(true));

    await waitFor(() =>
      expect(listEscalationsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ triage: true }),
      ),
    );
  });

  it("openSummary carga resumen y timeline reales del caso", async () => {
    listEscalationsMock.mockResolvedValue([]);
    const escalation = makeEscalation();
    getCaseSummaryMock.mockResolvedValueOnce(escalation.summary);
    getCaseTimelineMock.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useEscalations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.openSummary(escalation);
    });

    expect(getCaseSummaryMock).toHaveBeenCalledWith("case_1");
    expect(result.current.summary).toEqual(escalation.summary);
    expect(result.current.summaryFor).toEqual(escalation);
  });

  it("openSummary cae al summary embebido en la escalación si el gateway falla", async () => {
    listEscalationsMock.mockResolvedValue([]);
    const escalation = makeEscalation();
    getCaseSummaryMock.mockRejectedValueOnce(new Error("network"));
    getCaseTimelineMock.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useEscalations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.openSummary(escalation);
    });

    expect(result.current.summary).toEqual(escalation.summary);
  });

  it("claim delega en useCaseActions con el caseId de la escalación", async () => {
    listEscalationsMock.mockResolvedValue([]);
    claimCaseMock.mockResolvedValueOnce(undefined);
    const escalation = makeEscalation();

    const { result } = renderHook(() => useEscalations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.claim(escalation);
    });

    expect(claimCaseMock).toHaveBeenCalledWith("case_1", "manager_1");
  });
});
