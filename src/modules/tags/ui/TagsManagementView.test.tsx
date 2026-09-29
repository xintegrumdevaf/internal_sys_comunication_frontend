import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TagsManagementView } from "./TagsManagementView";

describe("TagsManagementView", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renderiza el buscador y lista de etiquetas iniciales", () => {
    render(<TagsManagementView />);

    expect(screen.getByPlaceholderText("Buscar etiqueta...")).toBeInTheDocument();
    expect(screen.getByText("Nueva etiqueta")).toBeInTheDocument();
    expect(screen.getByText("AGENDADO")).toBeInTheDocument();
    expect(screen.getByText("MONITOREO")).toBeInTheDocument();
  });

  it("permite abrir el modal y crear una nueva etiqueta personalizada", () => {
    render(<TagsManagementView />);

    const newBtn = screen.getByText("Nueva etiqueta");
    fireEvent.click(newBtn);

    const inputName = screen.getByPlaceholderText(/INFORMATIVO-ADMINISTRATIVO/i);
    fireEvent.change(inputName, { target: { value: "PROMO_SEPTIEMBRE" } });

    const submitBtn = screen.getByText("Agregar");
    fireEvent.click(submitBtn);

    expect(screen.getByText("PROMO_SEPTIEMBRE")).toBeInTheDocument();
  });
});
