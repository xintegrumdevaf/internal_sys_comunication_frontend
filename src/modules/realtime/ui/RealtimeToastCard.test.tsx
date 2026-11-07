import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RealtimeToastCard } from "./RealtimeToastCard";

describe("RealtimeToastCard", () => {
  it("renders customer name, formatted phone, escalation reason and triggers actions", () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();

    render(
      <RealtimeToastCard
        type="escalated"
        title="Caso escalado a humano"
        customerName="Taco Taipe John"
        customerPhone="593987654321"
        reason="REQUEST_HUMAN"
        actionLabel="Atender conversación"
        onAction={onAction}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText("Caso escalado a humano")).toBeInTheDocument();
    expect(screen.getByText("Taco Taipe John")).toBeInTheDocument();
    expect(screen.getByText("+593 987 654 321")).toBeInTheDocument();
    expect(screen.getByText("Solicitud de asesor humano")).toBeInTheDocument();
    expect(screen.getByText("Escalado urgente")).toBeInTheDocument();

    const actionBtn = screen.getByRole("button", { name: /atender conversación/i });
    fireEvent.click(actionBtn);
    expect(onAction).toHaveBeenCalledTimes(1);

    const dismissBtn = screen.getByTitle("Descartar");
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders assigned card with proper badge and phone", () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();

    render(
      <RealtimeToastCard
        type="assigned"
        title="Se te asignó un caso"
        customerName="Elena Ramos"
        customerPhone="593991234567"
        actionLabel="Atender caso"
        onAction={onAction}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText("Se te asignó un caso")).toBeInTheDocument();
    expect(screen.getByText("Caso asignado")).toBeInTheDocument();
    expect(screen.getByText("Elena Ramos")).toBeInTheDocument();
    expect(screen.getByText("+593 991 234 567")).toBeInTheDocument();
  });
});
