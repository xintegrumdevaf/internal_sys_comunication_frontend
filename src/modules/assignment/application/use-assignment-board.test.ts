import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAssignmentBoard } from "./use-assignment-board";
import type { CaseDto } from "@/modules/cases/domain/case";
import type { ConversationDto } from "@/modules/conversations/domain/conversation";
import type { SessionUser } from "@/modules/identity/domain/session";
import type { DepartmentDto } from "@/modules/identity/domain/department";

const listConversationsMock = vi.fn();
vi.mock("@/modules/conversations/infrastructure/conversation.gateway", () => ({
  listConversations: (...args: unknown[]) => listConversationsMock(...args),
}));

const getCaseMock = vi.fn();
const assignCaseMock = vi.fn();
const reassignCaseMock = vi.fn();
vi.mock("@/modules/cases/infrastructure/case.gateway", () => ({
  getCase: (...args: unknown[]) => getCaseMock(...args),
  assignCase: (...args: unknown[]) => assignCaseMock(...args),
  reassignCase: (...args: unknown[]) => reassignCaseMock(...args),
  claimCase: vi.fn(),
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
  landing: "/",
};

const departments: DepartmentDto[] = [
  { id: "dept_support", slug: "support", name: "Soporte técnico", visibility: "shared", active: true, createdAt: "" },
];

const agentInDept: SessionUser = { ...session, id: "agent_1", role: "agent", name: "Laura Mendoza" };

vi.mock("@/modules/identity/application/use-session", () => ({
  useSession: () => session,
  useDepartmentsQuery: () => ({ data: departments }),
  useDirectoryUsers: () => [agentInDept],
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeConversation(overrides: Partial<ConversationDto> = {}): ConversationDto {
  return {
    id: "conv_1",
    waPhone: "593998576466",
    customerId: null,
    activeCaseId: "case_1",
    status: "open",
    lastActivityAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessagePreview: null,
    ...overrides,
  };
}

function makeCase(overrides: Partial<CaseDto> = {}): CaseDto {
  return {
    id: "case_1",
    conversationId: "conv_1",
    workflowType: "SUPPORT_INTERNET",
    status: "ESCALATED",
    departmentId: "dept_support",
    assignedAgentId: null,
    context: { workflowType: "SUPPORT_INTERNET", data: {} },
    automation: { enabled: false, disabledReason: null },
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    expiresAt: null,
    ...overrides,
  };
}

describe("useAssignmentBoard", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("selecciona el primer departamento disponible y carga sus casos activos", async () => {
    listConversationsMock.mockResolvedValueOnce([makeConversation()]);
    getCaseMock.mockResolvedValueOnce(makeCase());

    const { result } = renderHook(() => useAssignmentBoard());

    await waitFor(() => expect(result.current.departmentId).toBe("dept_support"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(listConversationsMock).toHaveBeenCalledWith({ departmentId: "dept_support", status: "open" });
    expect(result.current.cases).toHaveLength(1);
    expect(result.current.unassigned).toHaveLength(1);
  });

  it("agentsInDept solo incluye agentes activos con ese departamento como principal", async () => {
    listConversationsMock.mockResolvedValue([]);
    const { result } = renderHook(() => useAssignmentBoard());

    await waitFor(() => expect(result.current.departmentId).toBe("dept_support"));
    expect(result.current.agentsInDept.map((a) => a.id)).toEqual(["agent_1"]);
  });

  it("assignCase delega en el gateway con el actor real de la sesión", async () => {
    listConversationsMock.mockResolvedValue([makeConversation()]);
    getCaseMock.mockResolvedValue(makeCase());
    assignCaseMock.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAssignmentBoard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.assignCase("case_1", "agent_1");
    });

    expect(assignCaseMock).toHaveBeenCalledWith("case_1", "agent_1", "manager_1", undefined);
  });

  it("un caso con getCase fallido se descarta en vez de romper el tablero", async () => {
    listConversationsMock.mockResolvedValueOnce([
      makeConversation({ id: "conv_1", activeCaseId: "case_1" }),
      makeConversation({ id: "conv_2", activeCaseId: "case_2" }),
    ]);
    getCaseMock
      .mockResolvedValueOnce(makeCase({ id: "case_1" }))
      .mockRejectedValueOnce(new Error("404"));

    const { result } = renderHook(() => useAssignmentBoard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.cases).toHaveLength(1);
    expect(result.current.cases[0]!.id).toBe("case_1");
  });
});
