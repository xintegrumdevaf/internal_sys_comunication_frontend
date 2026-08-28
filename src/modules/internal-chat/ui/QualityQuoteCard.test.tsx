import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QualityQuoteCard } from "./QualityQuoteCard";
import type { InternalMessage } from "@/services/internalChatApi";

describe("QualityQuoteCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders quality quote observation details with severity, category, excerpt and cordiality", () => {
    const message: InternalMessage = {
      id: "msg_q1",
      threadId: "thread_1",
      senderAgentId: "supervisor_1",
      senderAgentName: "Supervisor Ana",
      type: "quality_quote",
      body: "Favor revisar el tono en este mensaje.",
      contextData: {
        category: "disrespect",
        severity: "high",
        excerpt: "No es problema mío, arrégleselas.",
        cordialityScore: 25,
        qualityReviewId: "rev_123",
      },
      createdAt: "2026-08-27T10:00:00Z",
    };

    const handleNavigate = vi.fn();

    render(<QualityQuoteCard message={message} onNavigateToAudit={handleNavigate} />);

    expect(screen.getByText(/Observación de Calidad \(disrespect\)/i)).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText(/"No es problema mío, arrégleselas."/i)).toBeInTheDocument();
    expect(screen.getByText(/25\/100/i)).toBeInTheDocument();
    expect(screen.getByText("Favor revisar el tono en este mensaje.")).toBeInTheDocument();

    const auditBtn = screen.getByRole("button", { name: /Ver conversación auditada/i });
    expect(auditBtn).toBeInTheDocument();
    fireEvent.click(auditBtn);
    expect(handleNavigate).toHaveBeenCalledWith("rev_123");
  });

  it("renders medium/low severity and handles missing fields gracefully", () => {
    const message: InternalMessage = {
      id: "msg_q2",
      threadId: "thread_1",
      senderAgentId: "supervisor_1",
      senderAgentName: "Supervisor Ana",
      type: "quality_quote",
      body: "Comentario general.",
      contextData: {
        category: "inefficiency",
        severity: "medium",
      },
      createdAt: "2026-08-27T10:00:00Z",
    };

    render(<QualityQuoteCard message={message} />);

    expect(screen.getByText(/Observación de Calidad \(inefficiency\)/i)).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Ver conversación auditada/i }),
    ).not.toBeInTheDocument();
  });
});
