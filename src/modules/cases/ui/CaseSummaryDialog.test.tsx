import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CaseSummaryDialog } from "./CaseSummaryDialog";
import type { CaseSummaryDto } from "@/modules/cases/domain/case";

describe("CaseSummaryDialog - Telemetría y Trazabilidad", () => {
  afterEach(() => {
    cleanup();
  });

  it("muestra la sección de telemetría con 'No encontrada (null)' cuando el diagnóstico falla antes de leer la ONU", () => {
    const failedSummary: CaseSummaryDto = {
      problem: "Cliente reporta problema de internet",
      workflow: "SUPPORT_INTERNET",
      department: "support",
      status: "ESCALATED",
      reason:
        'Servicio de diagnostico respondio 422: {"code":"OLT_NOT_FOUND","message":"OLT cData no existe en bellavista"}',
      completedSteps: ["VALIDATE_CLIENT", "CHECK_CLIENT_STATUS"],
      results: {
        client: { fullName: "SAMANIEGO PINEDA JOHN WALTER", nationalId: "0102110582" },
        contract: {
          id: "0001638",
          ip: "10.10.2.37",
          pon: 2,
          sector: "bellavista",
          serial: "48575443EAE381BB",
          oltName: "cData",
        },
        rawOutput: '/ip firewall address-list print where address="10.10.2.37"',
      },
      pendingAction: "Intervención humana",
      timeline: [
        { action: "WAITING_USER", status: "COMPLETED", at: "2026-09-22T15:22:26.316Z" },
        { action: "VALIDATE_CLIENT", status: "COMPLETED", at: "2026-09-22T15:23:30.679Z" },
        { action: "CHECK_CLIENT_STATUS", status: "COMPLETED", at: "2026-09-22T15:23:42.622Z" },
        { action: "DIAGNOSTIC", status: "FAILED", at: "2026-09-22T15:23:42.638Z" },
        { action: "ESCALATE", status: "COMPLETED", at: "2026-09-22T15:23:42.650Z" },
      ],
    };

    render(
      <CaseSummaryDialog
        open={true}
        onOpenChange={() => {}}
        summary={failedSummary}
        timeline={[]}
        departments={[
          { id: "1", name: "Soporte Técnico", slug: "support", visibility: "shared", active: true },
        ]}
      />,
    );

    // Debe mostrar la sección de telemetría técnica
    expect(screen.getByText(/Telemetría del Equipo \(ONU\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Diagnóstico incompleto \/ fallido/i)).toBeInTheDocument();

    // Potencia y MAC explícitamente "No encontrada (null)"
    const nullValues = screen.getAllByText("No encontrada (null)");
    expect(nullValues.length).toBeGreaterThanOrEqual(2); // Power y MAC

    // Estado del equipo debe indicar fallo
    expect(screen.getByText("No obtenido (falló diagnóstico)")).toBeInTheDocument();

    // Serial ONU tomado del contrato (aparece en Contrato y en Telemetría)
    expect(screen.getAllByText("48575443EAE381BB").length).toBeGreaterThanOrEqual(2);

    // Consola técnica MikroTik colapsable
    expect(screen.getByText(/Ver consola técnica MikroTik RouterOS/i)).toBeInTheDocument();

    // Motivo humanizado sin JSON crudo
    expect(
      screen.getByText(
        /Servicio de diagnostico respondio 422: OLT cData no existe en bellavista \(OLT_NOT_FOUND\)/i,
      ),
    ).toBeInTheDocument();
  });

  it("renderiza la trazabilidad de comandos (_history) de forma colapsable sin saturar al usuario", () => {
    const historySummary: CaseSummaryDto = {
      problem: "Cliente reporta lentitud",
      workflow: "SUPPORT_INTERNET",
      department: "support",
      status: "ESCALATED",
      reason: "ONU con señal degradada",
      completedSteps: ["VALIDATE_CLIENT", "DIAGNOSTIC"],
      results: {
        client: { fullName: "María López", nationalId: "0999999999" },
        contract: { sector: "Centro", oltName: "Huawei-01", pon: 1, serial: "HWTC1234" },
        technical: {
          brand: "Huawei",
          opticalPowerDbm: -28.5,
          macAddress: "AA:BB:CC:DD:EE:FF",
          _history: [
            { step: "Auth OLT", command: "telnet 10.0.0.1", success: true },
            {
              step: "Query ONU power",
              command: "display ont optical-info 1 1",
              raw: "Rx power: -28.5 dBm",
              success: true,
            },
          ],
        },
      },
      pendingAction: "Intervención humana",
      timeline: [],
    };

    render(
      <CaseSummaryDialog
        open={true}
        onOpenChange={() => {}}
        summary={historySummary}
        timeline={[]}
      />,
    );

    // Acordeón de trazabilidad presente pero no intrusivo
    expect(screen.getByText(/Trazabilidad de comandos OLT \(2 pasos\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Query ONU power/i)).toBeInTheDocument();
    expect(screen.getByText(/\$ display ont optical-info 1 1/i)).toBeInTheDocument();
  });
});
