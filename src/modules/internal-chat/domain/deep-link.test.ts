import { describe, expect, it } from "vitest";
import {
  parseInternalChatDeepLink,
  qualityFindingsChatMessage,
  qualityReviewMessageMarker,
} from "./deep-link";
import type { QualityReviewDto } from "@/modules/quality/domain/quality-review";

describe("parseInternalChatDeepLink", () => {
  it("lee peerId y qualityReviewId desde URLSearchParams", () => {
    const params = new URLSearchParams(
      "peerId=agent-42&qualityReviewId=rev-9&extra=1",
    );
    expect(parseInternalChatDeepLink(params)).toEqual({
      peerId: "agent-42",
      qualityReviewId: "rev-9",
    });
  });

  it("omite vacíos", () => {
    expect(parseInternalChatDeepLink({ peerId: "", qualityReviewId: "x" })).toEqual({
      peerId: undefined,
      qualityReviewId: "x",
    });
  });
});

describe("qualityFindingsChatMessage", () => {
  it("arma mensaje de hilo con excerpts y marcador idempotente", () => {
    const review: QualityReviewDto = {
      id: "rev-1",
      conversationId: "c1",
      caseId: "case1",
      agentId: "a1",
      departmentId: null,
      cordialityScore: 35,
      efficiencyNotes: null,
      summary: "Atención pobre",
      errorMessage: null,
      status: "ready",
      trigger: "auto_case_closed",
      customerLabel: "Ana Cliente",
      waPhone: "+5939900103",
      waProfileName: null,
      highFindingCount: 1,
      findingCount: 2,
      findings: [
        {
          id: "1",
          messageId: "11111111-1111-1111-1111-111111111111",
          severity: "high",
          category: "aggression",
          excerpt: "mmm no sé",
          rationale: "Descuido",
        },
        {
          id: "2",
          messageId: "22222222-2222-2222-2222-222222222222",
          severity: "low",
          category: "other",
          excerpt: "ok",
          rationale: "menor",
        },
      ],
      notes: [],
      startedAt: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    const text = qualityFindingsChatMessage(review);
    expect(text).toContain(qualityReviewMessageMarker("rev-1"));
    expect(text).toContain("mmm no sé");
    expect(text).toContain("Ana Cliente");
    expect(text).toContain("Atención pobre");
    expect(text).not.toContain('"ok"');
  });
});
