import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ZernioSyncControl } from "./ZernioSyncControl";
import { conversationService } from "@/services/conversation.service";

vi.mock("@/services/conversation.service", () => ({
  conversationService: {
    getZernioHistorySyncStatus: vi.fn(),
    startZernioHistorySync: vi.fn(),
  },
}));

describe("ZernioSyncControl", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renderiza el botón de sincronización cuando el estado es idle", async () => {
    vi.mocked(conversationService.getZernioHistorySyncStatus).mockResolvedValueOnce({
      status: "idle",
      totalMessagesSynced: 0,
      startedAt: null,
      completedAt: null,
      lastError: null,
    });

    render(<ZernioSyncControl />);

    await waitFor(() => {
      expect(
        screen.getByTitle(/Importar mensajes y conversaciones históricas desde Zernio/i),
      ).toBeInTheDocument();
    });
  });

  it("muestra el badge animado cuando la sincronización está en ejecución", async () => {
    vi.mocked(conversationService.getZernioHistorySyncStatus).mockResolvedValueOnce({
      status: "running",
      totalMessagesSynced: 1250,
      startedAt: "2026-09-07T12:00:00Z",
      completedAt: null,
      lastError: null,
    });

    render(<ZernioSyncControl />);

    await waitFor(() => {
      expect(screen.getByText(/Sincronizando:.*mensajes importados/i)).toBeInTheDocument();
    });
  });

  it("abre el modal de confirmación y permite iniciar la sincronización", async () => {
    vi.mocked(conversationService.getZernioHistorySyncStatus).mockResolvedValue({
      status: "idle",
      totalMessagesSynced: 0,
      startedAt: null,
      completedAt: null,
      lastError: null,
    });

    vi.mocked(conversationService.startZernioHistorySync).mockResolvedValueOnce({
      message: "Sincronización en curso",
      jobId: "job-999",
    });

    render(<ZernioSyncControl />);

    const openBtn = await screen.findByTitle(
      /Importar mensajes y conversaciones históricas desde Zernio/i,
    );
    fireEvent.click(openBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Esto importará las conversaciones y mensajes históricos de Zernio en segundo plano/i,
      ),
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Iniciar Sincronización/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(conversationService.startZernioHistorySync).toHaveBeenCalledWith(30);
    });
  });
});
