import { describe, expect, it } from "vitest";
import {
  buildQualityChatDeepLink,
  cordialityBand,
  findingHighlightClass,
  findingSeverityForMessage,
  isMessageAnalysisComplete,
  messageAnalysisProgressLabel,
  unprocessedChatCount,
  type QualityFindingDto,
} from "./quality-review";

describe("cordialityBand", () => {
  it("clasifica umbrales de 07_QUALITY_SUPERVISION.md §4", () => {
    expect(cordialityBand(100)).toBe("ok");
    expect(cordialityBand(70)).toBe("ok");
    expect(cordialityBand(69)).toBe("attention");
    expect(cordialityBand(40)).toBe("attention");
    expect(cordialityBand(39)).toBe("critical");
    expect(cordialityBand(null)).toBe(null);
  });
});

describe("findingSeverityForMessage / highlight", () => {
  const findings: QualityFindingDto[] = [
    {
      id: "f1",
      messageId: "m1",
      severity: "low",
      category: "other",
      excerpt: "x",
      rationale: "y",
    },
    {
      id: "f2",
      messageId: "m1",
      severity: "high",
      category: "aggression",
      excerpt: "x",
      rationale: "y",
    },
    {
      id: "f3",
      messageId: "m2",
      severity: "medium",
      category: "neglect",
      excerpt: "x",
      rationale: "y",
    },
  ];

  it("elige la severidad más grave por messageId", () => {
    expect(findingSeverityForMessage(findings, "m1")).toBe("high");
    expect(findingSeverityForMessage(findings, "m2")).toBe("medium");
    expect(findingSeverityForMessage(findings, "m3")).toBe(null);
  });

  it("devuelve clases de highlight por severidad", () => {
    expect(findingHighlightClass("high")).toContain("red-600");
    expect(findingHighlightClass("medium")).toBe("");
    expect(findingHighlightClass("low")).toBe("");
  });
});

describe("buildQualityChatDeepLink", () => {
  it("apunta a chat-interno con peerId y qualityReviewId", () => {
    expect(buildQualityChatDeepLink("agent-1", "review-9")).toEqual({
      to: "/chat-interno",
      search: { peerId: "agent-1", qualityReviewId: "review-9" },
    });
  });
});

describe("unprocessedChatCount / message progress", () => {
  it("cuenta cerrados sin score", () => {
    expect(
      unprocessedChatCount({ closedWithAgentMessages: 10, analyzedCount: 3 }),
    ).toBe(7);
    expect(
      unprocessedChatCount({ closedWithAgentMessages: 2, analyzedCount: 5 }),
    ).toBe(0);
  });

  it("etiqueta progreso de mensajes por conversación", () => {
    expect(
      messageAnalysisProgressLabel({
        messagesAnalyzed: 40,
        messagesTotal: 120,
        status: "pending",
      }),
    ).toBe("40/120 msgs");
    expect(
      isMessageAnalysisComplete({
        messagesAnalyzed: 120,
        messagesTotal: 120,
        status: "pending",
      }),
    ).toBe(true);
  });
});
