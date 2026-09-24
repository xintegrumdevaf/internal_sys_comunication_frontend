import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompleteCaseModal } from "./CompleteCaseModal";

describe("CompleteCaseModal", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders with default RESOLVED option selected", () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(
      <CompleteCaseModal open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    );

    expect(screen.getByText(/Cerrar \/ Completar Caso/i)).toBeInTheDocument();
    expect(screen.getByText(/Cierre normal \/ Resuelto/i)).toBeInTheDocument();
    expect(screen.getByText(/Cierre por falta de respuesta/i)).toBeInTheDocument();

    const resolvedRadio = screen.getByLabelText(/Cierre normal \/ Resuelto/i) as HTMLInputElement;
    expect(resolvedRadio.checked).toBe(true);
  });

  it("submits with default RESOLVED and resolutionNote", async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(
      <CompleteCaseModal open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    );

    const textarea = screen.getByPlaceholderText(/solución técnica/i);
    fireEvent.change(textarea, { target: { value: "Solucionado por reinicio de ONU" } });

    const submitBtn = screen.getByText(/Confirmar Cierre/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("RESOLVED", "Solucionado por reinicio de ONU");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("allows selecting CLIENT_NO_RESPONSE and submits correctly", async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(
      <CompleteCaseModal open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    );

    const noResponseRadio = screen.getByLabelText(/Cierre por falta de respuesta/i);
    fireEvent.click(noResponseRadio);

    const textarea = screen.getByPlaceholderText(/solución técnica/i);
    fireEvent.change(textarea, { target: { value: "Cliente no respondió tras 24h" } });

    const submitBtn = screen.getByText(/Confirmar Cierre/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("CLIENT_NO_RESPONSE", "Cliente no respondió tras 24h");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
