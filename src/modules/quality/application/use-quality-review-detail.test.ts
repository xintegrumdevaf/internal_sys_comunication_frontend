import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQualityReviewDetail } from "./use-quality-review-detail";
import type { SessionUser } from "@/modules/identity/domain/session";
import type { QualityReviewDto } from "@/modules/quality/domain/quality-review";

const getQualityReviewMock = vi.fn();
const addQualityCoachingNoteMock = vi.fn();
const markQualityReviewReviewedMock = vi.fn();
const reanalyzeQualityReviewMock = vi.fn();
const listMessagesMock = vi.fn();

vi.mock("@/modules/quality/infrastructure/quality.gateway", () => ({
  getQualityReview: (...args: unknown[]) => getQualityReviewMock(...args),
  addQualityCoachingNote: (...args: unknown[]) => addQualityCoachingNoteMock(...args),
  markQualityReviewReviewed: (...args: unknown[]) => markQualityReviewReviewedMock(...args),
  requestOnDemandReview: vi.fn(),
  reanalyzeQualityReview: (...args: unknown[]) => reanalyzeQualityReviewMock(...args),
}));

vi.mock("@/modules/conversations/infrastructure/conversation.gateway", () => ({
  listMessages: (...args: unknown[]) => listMessagesMock(...args),
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

const baseReview: QualityReviewDto = {
  id: "rev-100",
  conversationId: "conv-100",
  caseId: "case-100",
  agentId: "agent-1",
  departmentId: "dept-1",
  cordialityScore: 50,
  efficiencyNotes: null,
  summary: "Resumen inicial",
  errorMessage: null,
  status: "ready",
  trigger: "auto_case_closed",
  customerLabel: "Cliente 100",
  waPhone: "593900000000",
  waProfileName: "Cliente",
  highFindingCount: 0,
  findingCount: 0,
  findings: [],
  notes: [],
  messagesTotal: 10,
  messagesAnalyzed: 10,
  chunkSize: 15,
  startedAt: "2026-11-06T10:00:00.000Z",
  completedAt: "2026-11-06T10:01:00.000Z",
  createdAt: "2026-11-06T10:00:00.000Z",
};

describe("useQualityReviewDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getQualityReviewMock.mockResolvedValue(baseReview);
    listMessagesMock.mockResolvedValue([]);
  });

  it("initializes with hasMutated = false", async () => {
    const { result } = renderHook(() => useQualityReviewDetail("rev-100"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.review?.id).toBe("rev-100");
    });

    expect(result.current.hasMutated).toBe(false);
  });

  it("sets hasMutated = true when reanalyzing", async () => {
    reanalyzeQualityReviewMock.mockResolvedValue({
      ...baseReview,
      status: "pending",
      cordialityScore: null,
    });

    const { result } = renderHook(() => useQualityReviewDetail("rev-100"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.reanalyze();
    });

    expect(result.current.hasMutated).toBe(true);
  });

  it("sets hasMutated = true when submitting a coaching note", async () => {
    addQualityCoachingNoteMock.mockResolvedValue({
      id: "note-1",
      reviewId: "rev-100",
      authorAgentId: "supervisor_1",
      body: "Excelente mejora",
      ackStatus: "open",
      acknowledgedAt: null,
      createdAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useQualityReviewDetail("rev-100"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setNoteDraft("Excelente mejora");
    });

    await act(async () => {
      await result.current.submitNote();
    });

    expect(result.current.hasMutated).toBe(true);
  });
});
