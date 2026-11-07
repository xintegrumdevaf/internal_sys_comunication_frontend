import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QualityFindingsList } from "./QualityFindingsList";
import type { QualityFindingDto } from "@/modules/quality/domain/quality-review";

describe("QualityFindingsList", () => {
  afterEach(cleanup);

  it("muestra estado vacío cuando no hay hallazgos", () => {
    render(<QualityFindingsList findings={[]} />);
    expect(screen.getByText(/Sin observaciones críticas/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No se detectaron faltas graves ni oportunidades de mejora/i),
    ).toBeInTheDocument();
  });

  it("renderiza tarjetas de hallazgos con cita de chat, diagnóstico y botones de acción", () => {
    const mockFindings: QualityFindingDto[] = [
      {
        id: "f1",
        messageId: "m-12",
        severity: "medium",
        category: "inefficiency",
        excerpt: "borre las cookies de su navegador por favor",
        rationale: "Instrucción aislada sin contexto.",
        recommendation: "Enviar un plan integral con pasos numerados.",
      },
      {
        id: "f2",
        messageId: "m-19",
        severity: "high",
        category: "neglect",
        excerpt: "tampoco me sale la opcion que dice",
        rationale: "Demora de más de 45 minutos sin responder.",
        recommendation: "Avisar al cliente sobre el tiempo de espera.",
      },
    ];

    const onScroll = vi.fn();
    const onObject = vi.fn();

    render(
      <QualityFindingsList
        findings={mockFindings}
        onScrollToMessage={onScroll}
        onObjectInChat={onObject}
      />,
    );

    // Contadores en cabecera
    expect(screen.getByText(/Observaciones y Conductas \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Grave/i)).toBeInTheDocument();
    expect(screen.getByText(/1 a mejorar/i)).toBeInTheDocument();

    // Mensajes auditados en tarjetas de chat ejecutivas
    expect(screen.getByText(/borre las cookies de su navegador por favor/i)).toBeInTheDocument();
    expect(screen.getByText(/tampoco me sale la opcion que dice/i)).toBeInTheDocument();

    // Diagnósticos y recomendaciones
    expect(screen.getByText(/Instrucción aislada sin contexto./i)).toBeInTheDocument();
    expect(screen.getByText(/Enviar un plan integral con pasos numerados./i)).toBeInTheDocument();

    // Botones de acción y tarjetas interactivas
    const scrollButtons = screen.getAllByRole("button", { name: /Ver en chat/i });
    expect(scrollButtons.length).toBe(2);
    fireEvent.click(scrollButtons[0]);
    expect(onScroll).toHaveBeenCalledWith("m-12");

    const messageCards = screen.getAllByTitle(
      /Hacé click para ubicar este mensaje en el chat y entender el contexto previo/i,
    );
    expect(messageCards.length).toBe(2);
    fireEvent.click(messageCards[0]);
    expect(onScroll).toHaveBeenCalledWith("m-12");

    const objectButtons = screen.getAllByRole("button", { name: /Objetar/i });
    expect(objectButtons.length).toBe(2);
    fireEvent.click(objectButtons[1]);
    expect(onObject).toHaveBeenCalledWith(mockFindings[1]);
  });
});
