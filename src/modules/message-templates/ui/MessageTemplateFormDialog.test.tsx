import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MessageTemplateFormDialog } from "./MessageTemplateFormDialog";
import type { WabaConnectionDto } from "@/modules/message-templates/domain/message-template";

const mockConnections: WabaConnectionDto[] = [
  { id: "conn_1", name: "Línea Oficial WhatsApp", status: "active" },
];

describe("MessageTemplateFormDialog", () => {
  it("no se renderiza cuando isOpen es false", () => {
    render(
      <MessageTemplateFormDialog
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        connections={mockConnections}
        submitting={false}
      />,
    );

    expect(screen.queryByText("Crear plantilla")).toBeNull();
  });

  it("limpia todos los campos cuando se vuelve a abrir el modal", () => {
    const { rerender } = render(
      <MessageTemplateFormDialog
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        connections={mockConnections}
        submitting={false}
      />,
    );

    const nameInput = screen.getByPlaceholderText("pedido_confirmado") as HTMLInputElement;
    const bodyTextarea = screen.getByPlaceholderText(
      'Escribe tu mensaje. Toca "Agregar variable" para insertar campos como {{1}}, {{2}}...',
    ) as HTMLTextAreaElement;

    // Simular escritura de usuario
    fireEvent.change(nameInput, { target: { value: "plantilla_prueba_anterior" } });
    fireEvent.change(bodyTextarea, { target: { value: "Este es un texto de prueba anterior" } });

    expect(nameInput.value).toBe("plantilla_prueba_anterior");
    expect(bodyTextarea.value).toBe("Este es un texto de prueba anterior");

    // Cerrar modal (isOpen = false)
    rerender(
      <MessageTemplateFormDialog
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        connections={mockConnections}
        submitting={false}
      />,
    );

    // Reabrir modal (isOpen = true)
    rerender(
      <MessageTemplateFormDialog
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        connections={mockConnections}
        submitting={false}
      />,
    );

    const newNameInput = screen.getByPlaceholderText("pedido_confirmado") as HTMLInputElement;
    const newBodyTextarea = screen.getByPlaceholderText(
      'Escribe tu mensaje. Toca "Agregar variable" para insertar campos como {{1}}, {{2}}...',
    ) as HTMLTextAreaElement;

    expect(newNameInput.value).toBe("");
    expect(newBodyTextarea.value).toBe("");
  });
});
