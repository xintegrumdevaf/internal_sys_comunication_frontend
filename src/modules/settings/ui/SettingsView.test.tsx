import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsView } from "./SettingsView";
import { settingsApi } from "../infrastructure/settings.api";

vi.mock("@/modules/identity/application/use-session", () => ({
  useSession: () => ({ session: { role: "admin" } }),
}));

describe("SettingsView - Integración de Tabs", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza todos los tabs incluyendo Routers y OLTs", async () => {
    vi.spyOn(settingsApi, "getSettings").mockResolvedValueOnce({
      channels: {
        provider: "meta",
        phoneNumberId: "123",
        wabaId: "456",
        accessToken: "tok",
        appSecret: "sec",
        verifyToken: "ver",
        zernioApiKey: "",
        zernioAccountId: "",
        zernioWebhookSecret: "",
        zernioBaseUrl: "",
      },
      ai: {
        provider: "gemini",
        geminiApiKey: "key",
        geminiModel: "gemini-2.5-flash",
        geminiEmbeddingModel: "text-embedding-004",
        geminiEmbeddingDimension: 768,
        ollamaBaseUrl: "",
        ollamaModel: "",
        ollamaEmbeddingModel: "",
        ollamaEmbeddingDimension: 768,
        aiCallTimeoutMs: 15000,
        aiQualityTimeoutMs: 30000,
      },
    });

    vi.spyOn(settingsApi, "getSetupStatus").mockResolvedValueOnce({
      isChannelConfigured: true,
      isAiConfigured: true,
      hasDepartments: true,
      hasAgents: true,
      isInitialSetupComplete: true,
      activeChannelProvider: "meta",
      activeAiProvider: "gemini",
    });

    render(<SettingsView />);

    expect(await screen.findByText("Canales de Mensajería")).toBeDefined();
    expect(screen.getByText("Inteligencia Artificial")).toBeDefined();
    expect(screen.getByText("Routers y OLTs")).toBeDefined();
    expect(screen.getByText("Cobertura KML")).toBeDefined();
  });
});
