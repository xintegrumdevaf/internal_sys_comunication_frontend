import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuditLogView } from "./AuditLogView";
import { auditApi } from "@/services/auditApi";
import { toast } from "sonner";

vi.mock("@/modules/identity/application/use-session", () => ({
  useDepartmentsQuery: () => ({
    data: [
      { id: "dept-1", name: "Ventas", active: true },
      { id: "dept-2", name: "Soporte", active: true },
    ],
  }),
}));

vi.mock("@/services/auditApi", () => ({
  auditApi: {
    listEvents: vi.fn(),
    getStats: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe("AuditLogView Date Filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auditApi.listEvents).mockResolvedValue({
      data: [],
      nextCursor: null,
    });
    vi.mocked(auditApi.getStats).mockResolvedValue({
      totalEvents: 10,
      byCategory: { security: 5, operational: 3, data_change: 2, system: 0 },
      topActions: [],
      topActors: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza campos de fecha Desde y Hasta y botón de filtrado", async () => {
    render(<AuditLogView />);

    expect(screen.getByText("Desde:")).toBeInTheDocument();
    expect(screen.getByText("Hasta:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /filtrar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(auditApi.listEvents).toHaveBeenCalledTimes(1);
    });
  });

  it("no dispara fetchEvents automáticamente al cambiar Desde antes de filtrar", async () => {
    render(<AuditLogView />);

    await waitFor(() => {
      expect(auditApi.listEvents).toHaveBeenCalledTimes(1);
    });

    const inputs = screen.getAllByDisplayValue("");
    const fromInput = inputs.find((el) => el.getAttribute("type") === "date");
    expect(fromInput).toBeDefined();

    fireEvent.change(fromInput!, { target: { value: "2026-11-11" } });

    // No debe haber disparado una segunda llamada solo por cambiar el input de fecha
    expect(auditApi.listEvents).toHaveBeenCalledTimes(1);
  });

  it("resuelve fechas en ISO y permite filtrar al enviar el formulario", async () => {
    render(<AuditLogView />);

    await waitFor(() => {
      expect(auditApi.listEvents).toHaveBeenCalledTimes(1);
    });

    const fromInput = screen.getByText("Desde:").parentElement?.querySelector("input[type='date']");
    const toInput = screen.getByText("Hasta:").parentElement?.querySelector("input[type='date']");

    expect(fromInput).toBeTruthy();
    expect(toInput).toBeTruthy();

    fireEvent.change(fromInput!, { target: { value: "2026-11-11" } });
    fireEvent.change(toInput!, { target: { value: "2026-11-16" } });

    const filterButton = screen.getByRole("button", { name: /filtrar/i });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(auditApi.listEvents).toHaveBeenCalledTimes(2);
      const lastCall = vi.mocked(auditApi.listEvents).mock.calls[1]?.[0];
      expect(lastCall?.from).toBeDefined();
      expect(lastCall?.to).toBeDefined();
      expect(new Date(lastCall!.from!).getTime()).toBeLessThan(new Date(lastCall!.to!).getTime());
    });
  });

  it("muestra error si la fecha Desde es posterior a Hasta y no llama al backend", async () => {
    render(<AuditLogView />);

    await waitFor(() => {
      expect(auditApi.listEvents).toHaveBeenCalledTimes(1);
    });

    const fromInput = screen.getByText("Desde:").parentElement?.querySelector("input[type='date']");
    const toInput = screen.getByText("Hasta:").parentElement?.querySelector("input[type='date']");

    fireEvent.change(fromInput!, { target: { value: "2026-11-20" } });
    fireEvent.change(toInput!, { target: { value: "2026-11-10" } });

    const filterButton = screen.getByRole("button", { name: /filtrar/i });
    fireEvent.click(filterButton);

    expect(toast.error).toHaveBeenCalledWith("La fecha 'Desde' no puede ser posterior a 'Hasta'");
    // No debe haber hecho la segunda llamada
    expect(auditApi.listEvents).toHaveBeenCalledTimes(1);
  });

  it("muestra botón Limpiar cuando hay fechas y limpia el filtro al hacer click", async () => {
    render(<AuditLogView />);

    await waitFor(() => {
      expect(auditApi.listEvents).toHaveBeenCalledTimes(1);
    });

    const fromInput = screen
      .getByText("Desde:")
      .parentElement?.querySelector("input[type='date']") as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: "2026-11-11" } });

    const clearButton = screen.getByTitle("Limpiar fechas");
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);

    expect(fromInput.value).toBe("");
    await waitFor(() => {
      expect(auditApi.listEvents).toHaveBeenCalledTimes(2);
      const lastCall = vi.mocked(auditApi.listEvents).mock.calls[1]?.[0];
      expect(lastCall?.from).toBeUndefined();
      expect(lastCall?.to).toBeUndefined();
    });
  });
});
