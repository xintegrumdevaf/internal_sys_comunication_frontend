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
    expect(select).toHaveValue("");
    expect(select).toHaveAttribute("placeholder", "Busca o elige una etiqueta...");

    fireEvent.focus(select);
    expect(screen.getByText("AGENDADO")).toBeInTheDocument();
    expect(screen.getByText("POSPUESTO")).toBeInTheDocument();
    expect(screen.getByText("MONITOREO")).toBeInTheDocument();

    expect(screen.getByText(/Fecha y hora de recordatorio/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Cliente solicitó probar servicio/i)).toBeInTheDocument();
  });

  it("submits ISO string, selected tag and reminder note on confirmation", async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(<ScheduleCaseModal open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    const select = screen.getByRole("combobox");
    fireEvent.focus(select);
    fireEvent.click(screen.getByRole("button", { name: /MONITOREO/i }));

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

  it("muestra la etiqueta previa y deja ver el resto al abrir la lista", () => {
    render(
      <ScheduleCaseModal
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(true)}
        currentScheduleTag="MONITOREO"
      />,
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("MONITOREO");

    fireEvent.focus(select);
    expect(select).toHaveValue("MONITOREO");
    expect(screen.getByText("AGENDADO")).toBeInTheDocument();
    expect(screen.getByText("POSPUESTO")).toBeInTheDocument();
    expect(screen.getByText("MONITOREO")).toBeInTheDocument();
  });
});
