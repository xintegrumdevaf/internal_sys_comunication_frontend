import { describe, expect, it } from "vitest";
import { caseStatusLabel, clientNameFromCase, workflowLabel } from "./case";
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
