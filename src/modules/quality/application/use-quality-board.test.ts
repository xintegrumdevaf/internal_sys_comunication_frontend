import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQualityBoard } from "./use-quality-board";
import type { SessionUser } from "@/modules/identity/domain/session";

const listAgentQualityStatsMock = vi.fn();
const listQualityReviewsMock = vi.fn();
const getQualityPendingCountMock = vi.fn();

vi.mock("@/modules/quality/infrastructure/quality.gateway", () => ({
  listAgentQualityStats: (...args: unknown[]) => listAgentQualityStatsMock(...args),
  listQualityReviews: (...args: unknown[]) => listQualityReviewsMock(...args),
  getQualityPendingCount: (...args: unknown[]) => getQualityPendingCountMock(...args),
  analyzeQualityBatch: vi.fn(),
  requestOnDemandReview: vi.fn(),
  reanalyzeAllQualityReviews: vi.fn(),
}));

const mockSession: SessionUser = {
  id: "supervisor_1",
  name: "Supervisor Test",
  initials: "ST",
  email: "sup@isp.local",
  role: "admin",
  active: true,
  primaryDepartmentId: "dept_soporte",
  departmentIds: ["dept_soporte"],
  departmentSlug: "soporte",
  departmentName: "Soporte",
  roleLabel: "Admin",
  autoAssignEnabled: false,
  mustChangePassword: false,
  landing: "/",
};

vi.mock("@/modules/identity/application/use-session", () => ({
  useSession: () => mockSession,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

describe("useQualityBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listAgentQualityStatsMock.mockResolvedValue([]);
    listQualityReviewsMock.mockResolvedValue([
      {
        id: "rev-1",
        conversationId: "conv-1",
        caseId: "case-1",
        agentId: "agent-1",
        cordialityScore: 48,
        status: "ready",
      },
    ]);
    getQualityPendingCountMock.mockResolvedValue(0);
  });

  it("loads reviews and stats on initial mount", async () => {
    const { result } = renderHook(() => useQualityBoard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(listQualityReviewsMock).toHaveBeenCalledTimes(1);
    expect(result.current.reviews).toHaveLength(1);
    expect(result.current.reviews[0].cordialityScore).toBe(48);
  });

  it("automatically reloads reviews silently when pausePolling transitions from true to false", async () => {
    const { result, rerender } = renderHook(
      ({ pausePolling }: { pausePolling: boolean }) => useQualityBoard({ pausePolling }),
      { initialProps: { pausePolling: true } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(listQualityReviewsMock).toHaveBeenCalledTimes(1);

    // Mock an updated review score in backend
    listQualityReviewsMock.mockResolvedValueOnce([
      {
        id: "rev-1",
        conversationId: "conv-1",
        caseId: "case-1",
        agentId: "agent-1",
        cordialityScore: 85,
        status: "ready",
      },
    ]);

    // User returns from review detail to board -> pausePolling becomes false
    rerender({ pausePolling: false });

    await waitFor(() => {
      expect(listQualityReviewsMock).toHaveBeenCalledTimes(2);
      expect(result.current.reviews[0].cordialityScore).toBe(85);
    });
  });
});
