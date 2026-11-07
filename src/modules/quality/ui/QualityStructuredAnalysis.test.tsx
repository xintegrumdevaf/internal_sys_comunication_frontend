import { describe, expect, it, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QualityStructuredAnalysis } from "./QualityStructuredAnalysis";

describe("QualityStructuredAnalysis", () => {
  afterEach(cleanup);
  it("renders structured analysis with faults, context, pedagogical recommendation and example reply", () => {
    const sampleSummary = `
Valoración total: 50/100 (requiere atención).
Conversación completa: 15 mensaje(s) en 2 tramo(s).

Puntos a mejorar (1):
- [Ineficiencia] «borre las cookies de su navegador por favor» — El agente proporciona instrucciones atomizadas.

Síntesis por tramos:
1. El cliente contactó por problemas de acceso. El desempeño del agente fue deficiente.
2. (1) FALTAS DETECTADAS: No se detectan faltas de respeto ni agresividad. (2) CONTEXTO Y MOTIVO: El cliente presenta dificultades de acceso a una página web. (3) RECOMENDACIÓN PEDAGÓGICA: El agente debe agrupar los pasos técnicos. Ejemplo de respuesta adecuada: 'Entiendo que sigue teniendo problemas para acceder. Por favor realice estas tres pruebas: 1) Borre cookies, 2) Ventana incógnito.'
`;

    render(<QualityStructuredAnalysis summary={sampleSummary} score={50} />);

    // Verifica que se reconoce el análisis y la cantidad de tramos
    expect(screen.getByText(/Análisis y Síntesis Ejecutiva/i)).toBeInTheDocument();
    expect(screen.getByText(/2 tramos auditados/i)).toBeInTheDocument();

    // Tramo 1 visible por defecto
    expect(screen.getByText(/El cliente contactó por problemas de acceso/i)).toBeInTheDocument();

    // Cambiar a Tramo 2
    const tramo2Button = screen.getByRole("button", { name: /Tramo 2/i });
    fireEvent.click(tramo2Button);

    // En Tramo 2 deben aparecer los bloques estructurados
    expect(screen.getByText(/Conducta de Atención/i)).toBeInTheDocument();
    expect(screen.getByText(/Contexto y Motivo del Contacto/i)).toBeInTheDocument();
    expect(screen.getByText(/Recomendación Pedagógica de Coaching/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Ejemplo exacto de cómo debió responder el agente:/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Entiendo que sigue teniendo problemas para acceder/i),
    ).toBeInTheDocument();
  });

  it("renders plain fallback text when summary has no structured tramos", () => {
    const plain = "Atención cordial sin inconvenientes detectados.";
    render(<QualityStructuredAnalysis summary={plain} score={95} />);

    expect(screen.getByText(/Análisis y Síntesis Ejecutiva/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Atención cordial sin inconvenientes detectados./i),
    ).toBeInTheDocument();
  });
});
