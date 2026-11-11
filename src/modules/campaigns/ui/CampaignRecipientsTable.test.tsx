import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CampaignRecipientsTable } from "./CampaignRecipientsTable";
import type { Campaign, CampaignRecipient } from "../domain/campaign";

const mockCampaign: Campaign = {
  id: "camp-1",
  name: "Campaña Test",
  status: "RUNNING",
  lineName: "Linea 1",
  quickMode: false,
  intervalSeconds: 0,
  messageText: "Hola mundo",
  messageBody: "Hola mundo",
  totalRecipients: 3,
  sentCount: 1,
  failedCount: 1,
  queuedCount: 1,
  deliveredCount: 1,
  readCount: 0,
  repliedCount: 0,
  createdAt: "2026-11-09T00:00:00.000Z",
  updatedAt: "2026-11-09T00:00:00.000Z",
  routingConfig: {
    chatStatus: "open",
    keepAssigned: false,
    delegateToBot: false,
    forceChatUpdate: false,
  },
  contactConfig: {
    tags: [],
    customFields: [],
    forceContactUpdate: false,
  },
};

describe("CampaignRecipientsTable UI", () => {
  it("muestra badge 'Reintento 2/3' y hora programada cuando el destinatario está en reintento automático", () => {
    const nextRetryDate = new Date(Date.now() + 60000);
    const recipients: CampaignRecipient[] = [
      {
        id: "rec-1",
        number: "+593999999999",
        name: "Juan Perez",
        status: "queued",
        retryCount: 2,
        nextRetryAt: nextRetryDate.toISOString(),
        errorMessage: "WhatsApp sendTemplate fallo (429): Rate limit exceeded",
      },
    ];

    render(
      <CampaignRecipientsTable
        recipients={recipients}
        campaign={mockCampaign}
        activeFilter="ALL"
        onFilterChange={() => {}}
      />,
    );

    expect(screen.getByText(/Reintento 2\/3/i)).toBeInTheDocument();
    expect(screen.getByText(/Reintenta:/i)).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp sendTemplate fallo \(429\)/i)).toBeInTheDocument();
  });

  it("muestra badge 'Falló (3/3)' cuando el destinatario agotó todos los reintentos automáticos", () => {
    const recipients: CampaignRecipient[] = [
      {
        id: "rec-2",
        number: "+593988888888",
        name: "Maria Lopez",
        status: "failed",
        retryCount: 3,
        errorMessage: "ETIMEDOUT: Connection timed out",
      },
    ];

    render(
      <CampaignRecipientsTable
        recipients={recipients}
        campaign={mockCampaign}
        activeFilter="ALL"
        onFilterChange={() => {}}
      />,
    );

    expect(screen.getByText(/Falló \(3\/3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ETIMEDOUT: Connection timed out/i)).toBeInTheDocument();
  });
});
