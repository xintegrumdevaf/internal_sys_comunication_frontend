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
      expect(screen.getByText(/Sincronizando/i)).toBeInTheDocument();
    });
  });

  it("muestra el badge de sincronización finalizada cuando el estado es completed", async () => {
    vi.mocked(conversationService.getZernioHistorySyncStatus).mockResolvedValueOnce({
      status: "completed",
      totalMessagesSynced: 342,
      startedAt: "2026-09-07T12:00:00Z",
      completedAt: "2026-09-07T12:01:30Z",
      lastError: null,
    });

    render(<ZernioSyncControl />);

    await waitFor(() => {
      expect(screen.getByText(/Sincronización Finalizada \(342 msgs\)/i)).toBeInTheDocument();
    });

    // Abrir modal de detalles al hacer click
    const btn = screen.getByTitle(/Click para ver resumen completo de la sincronización/i);
    fireEvent.click(btn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Sincronización Histórica Finalizada/i)).toBeInTheDocument();
    expect(screen.getAllByText(/342/i).length).toBeGreaterThan(0);
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

  it("bloquea el inicio de una nueva sincronización si ya hay una en ejecución", async () => {
    vi.mocked(conversationService.getZernioHistorySyncStatus).mockResolvedValue({
      status: "running",
      totalMessagesSynced: 50,
      startedAt: "2026-09-07T12:00:00Z",
      completedAt: null,
      lastError: null,
    });

    render(<ZernioSyncControl />);

    const statusBadge = await screen.findByTitle(/Ver detalles de la sincronización en curso/i);
    fireEvent.click(statusBadge);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Intentar ir a Nueva sincronización
    const newSyncBtn = screen.getByText(/Nueva sincronización/i);
    fireEvent.click(newSyncBtn);

    expect(
      screen.getByText(
        /Ya existe una sincronización en curso. No es posible iniciar una nueva hasta que finalice la actual/i,
      ),
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Sincronización en Curso/i });
    expect(submitBtn).toBeDisabled();
  });
});

