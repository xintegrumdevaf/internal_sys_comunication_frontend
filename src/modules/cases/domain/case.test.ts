import { describe, expect, it } from "vitest";
import {
  caseStatusLabel,
  caseStepLabel,
  caseStepStatusLabel,
  clientNameFromCase,
  formatMacAddress,
  formatOpticalPower,
  humanizeCaseReason,
  paymentStatusLabel,
  workflowLabel,
} from "./case";
import type { CaseDto } from "./case";

function makeCase(overrides: Partial<CaseDto> = {}): CaseDto {
  return {
    id: "case_1",
    conversationId: "conv_1",
    workflowType: "SUPPORT_INTERNET",
    status: "HUMAN_ACTIVE",
    departmentId: "dept_support",
    assignedAgentId: "agent_1",
    context: { workflowType: "SUPPORT_INTERNET", data: {} },
    automation: { enabled: false, disabledReason: null },
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    expiresAt: null,
    ...overrides,
  };
}

describe("workflowLabel", () => {
  it("etiqueta los workflows conocidos del backend", () => {
    expect(workflowLabel("SUPPORT_INTERNET").label).toBe("Soporte");
    expect(workflowLabel("BILLING_BALANCE").label).toBe("Facturación");
    expect(workflowLabel("SALES_PACKAGES").label).toBe("Ventas");
    expect(workflowLabel("GENERAL_INQUIRY").label).toBe("Consulta");
  });

  it("cae a un badge neutro para workflows futuros no contemplados (Open/Closed)", () => {
    const result = workflowLabel("TECHNICAL_VISIT");
    expect(result.label).toBe("TECHNICAL_VISIT");
    expect(result.cls).toContain("muted-foreground");
  });

  it("indica 'Sin caso' cuando no hay workflowType (conversación sin caso activo)", () => {
    expect(workflowLabel(null).label).toBe("Sin caso");
    expect(workflowLabel(undefined).label).toBe("Sin caso");
  });
});

describe("caseStatusLabel", () => {
  it("traduce cada estado real del backend", () => {
    expect(caseStatusLabel("ESCALATED")).toBe("Escalado");
    expect(caseStatusLabel("HUMAN_ACTIVE")).toBe("Atendido por humano");
    expect(caseStatusLabel("COMPLETED")).toBe("Completado");
  });

  it("devuelve un placeholder cuando no hay estado", () => {
    expect(caseStatusLabel(undefined)).toBe("—");
  });
});

describe("caseStepLabel", () => {
  it("traduce los pasos conocidos del motor de workflow", () => {
    expect(caseStepLabel("VALIDATE_CLIENT")).toBe("Verificación de identidad del cliente");
    expect(caseStepLabel("CHECK_BALANCE")).toBe("Revisión de saldo");
    expect(caseStepLabel("ESCALATE")).toBe("Escalado a un agente humano");
  });

  it("humaniza pasos futuros no contemplados (nunca el enum crudo)", () => {
    expect(caseStepLabel("NEW_FUTURE_STEP")).toBe("New Future Step");
  });
});

describe("caseStepStatusLabel", () => {
  it("traduce los estados de un paso de la línea de tiempo", () => {
    expect(caseStepStatusLabel("COMPLETED")).toBe("Completado");
    expect(caseStepStatusLabel("FAILED")).toBe("Falló");
    expect(caseStepStatusLabel("DISPATCHED")).toBe("En proceso");
  });
});

describe("paymentStatusLabel", () => {
  it("traduce los 3 estados reales del comprobante de pago", () => {
    expect(paymentStatusLabel("PENDING")).toBe("Pendiente de revisión");
    expect(paymentStatusLabel("RECORDED")).toBe("Registrado");
    expect(paymentStatusLabel("REJECTED")).toBe("Rechazado");
  });

  it("devuelve un placeholder si no hay estado", () => {
    expect(paymentStatusLabel(undefined)).toBe("—");
  });
});

describe("clientNameFromCase", () => {
  it("extrae el nombre del cliente ya validado por VALIDATE_CLIENT", () => {
    const c = makeCase({
      context: {
        workflowType: "SUPPORT_INTERNET",
        data: { client: { nationalId: "123", fullName: "Ana López" } },
      },
    });
    expect(clientNameFromCase(c)).toBe("Ana López");
  });

  it("devuelve null si el caso todavía no validó cliente", () => {
    const c = makeCase({ context: { workflowType: "SUPPORT_INTERNET", data: {} } });
    expect(clientNameFromCase(c)).toBeNull();
  });

  it("devuelve null si no hay caso", () => {
    expect(clientNameFromCase(null)).toBeNull();
    expect(clientNameFromCase(undefined)).toBeNull();
  });
});

describe("formatOpticalPower", () => {
  it("formatea números válidos en dBm", () => {
    expect(formatOpticalPower(-19.54)).toEqual({ text: "-19.5 dBm", isMeasured: true });
    expect(formatOpticalPower(0)).toEqual({ text: "0.0 dBm", isMeasured: true });
  });

  it("devuelve 'No encontrada (null)' cuando el valor es null o undefined", () => {
    expect(formatOpticalPower(null)).toEqual({ text: "No encontrada (null)", isMeasured: false });
    expect(formatOpticalPower(undefined)).toEqual({ text: "No encontrada (null)", isMeasured: false });
    expect(formatOpticalPower(NaN)).toEqual({ text: "No encontrada (null)", isMeasured: false });
  });
});

describe("formatMacAddress", () => {
  it("formatea cadenas de MAC válidas", () => {
    expect(formatMacAddress("00:1A:2B:3C:4D:5E")).toEqual({
      text: "00:1A:2B:3C:4D:5E",
      isFound: true,
    });
  });

  it("soporta objetos { mac: string }", () => {
    expect(formatMacAddress({ mac: "00:1A:2B:3C:4D:5E" })).toEqual({
      text: "00:1A:2B:3C:4D:5E",
      isFound: true,
    });
  });

  it("devuelve 'No encontrada (null)' si es null, vacío o 'unknown'", () => {
    expect(formatMacAddress(null)).toEqual({ text: "No encontrada (null)", isFound: false });
    expect(formatMacAddress(undefined)).toEqual({ text: "No encontrada (null)", isFound: false });
    expect(formatMacAddress("")).toEqual({ text: "No encontrada (null)", isFound: false });
    expect(formatMacAddress("unknown")).toEqual({ text: "No encontrada (null)", isFound: false });
  });
});

describe("humanizeCaseReason", () => {
  it("extrae el mensaje y código de errores con JSON incrustado", () => {
    const raw =
      'Servicio de diagnostico respondio 422: {"code":"OLT_NOT_FOUND","message":"cData no existe en bellavista"}';
    expect(humanizeCaseReason(raw)).toBe(
      "Servicio de diagnostico respondio 422: cData no existe en bellavista (OLT_NOT_FOUND)",
    );
  });

  it("conserva el texto original si no contiene JSON", () => {
    expect(humanizeCaseReason("Cliente solicita cancelación")).toBe("Cliente solicita cancelación");
    expect(humanizeCaseReason(undefined)).toBe("—");
  });
});
