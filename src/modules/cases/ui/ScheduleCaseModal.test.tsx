import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScheduleCaseModal } from "./ScheduleCaseModal";

describe("ScheduleCaseModal", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders with datetime input, select tag dropdown and reminder note field", () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(<ScheduleCaseModal open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    expect(screen.getByText(/Agendar Seguimiento \/ Poner en Espera/i)).toBeInTheDocument();
    expect(screen.getByText(/Etiqueta de Agendamiento/i)).toBeInTheDocument();

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("AGENDADO");

    expect(screen.getByText(/Fecha y hora de recordatorio/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Cliente solicitó probar servicio/i)).toBeInTheDocument();
  });

  it("submits ISO string, selected tag and reminder note on confirmation", async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(<ScheduleCaseModal open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "MONITOREO" } });

    const inputNote = screen.getByPlaceholderText(/Cliente solicitó probar servicio/i);
    fireEvent.change(inputNote, { target: { value: "Revisar estado de red" } });

    const submitBtn = screen.getByText(/Confirmar Agendamiento/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.any(String),
        "MONITOREO",
        "Revisar estado de red",
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
