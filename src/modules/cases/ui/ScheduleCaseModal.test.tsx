import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScheduleCaseModal } from "./ScheduleCaseModal";

describe("ScheduleCaseModal", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders with datetime input and reminder reason field", () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(
      <ScheduleCaseModal open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    );

    expect(screen.getByText(/Agendar Seguimiento \/ Poner en Espera/i)).toBeInTheDocument();
    expect(screen.getByText(/Fecha y hora de recordatorio/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Verificar calidad de navegación/i)).toBeInTheDocument();
  });

  it("submits ISO string and reminder reason on confirmation", async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(
      <ScheduleCaseModal open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    );

    const inputReason = screen.getByPlaceholderText(/Verificar calidad de navegación/i);
    fireEvent.change(inputReason, { target: { value: "Revisar estado de red" } });

    const submitBtn = screen.getByText(/Confirmar Agendamiento/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(expect.any(String), "Revisar estado de red");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
