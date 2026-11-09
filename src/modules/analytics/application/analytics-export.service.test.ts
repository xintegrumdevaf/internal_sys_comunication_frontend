import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildAnalyticsWorkbook } from "./analytics-export.service";

describe("analytics-export.service", () => {
  const mockParams = {
    overview: {
      totalCases: 100,
      activeCases: 15,
      completedCases: 85,
      botContainmentRate: 65.5,
      avgResolutionTimeMinutes: 14.2,
      avgQueueWaitTimeSeconds: 45,
      escalationRate: 34.5,
      escalatedCases: 35,
    },
    distribution: {
      totalCases: 100,
      byWorkflow: [
        { workflowType: "SUPPORT_INTERNET", count: 60, percentage: 60 },
        { workflowType: "BILLING_BALANCE", count: 40, percentage: 40 },
      ],
      byFinalStatus: [
        { status: "COMPLETED", count: 85, percentage: 85 },
        { status: "ESCALATED", count: 15, percentage: 15 },
      ],
      topEscalationReasons: [
        { reason: "REQUEST_HUMAN", workflowType: "SUPPORT_INTERNET", count: 20, percentage: 57.1 },
      ],
      hourlyDemand: [{ hour: 10, label: "10:00", count: 12 }],
      dailyTrend: [{ date: "2026-11-01", incoming: 10, resolved: 9 }],
    },
    aiEfficiency: {
      overallContainmentRate: 65.5,
      botCompletedCases: 65,
      humanEscalatedCases: 35,
      funnelDropOff: [],
      unclearTriageCount: 3,
    },
    agentsPerformance: [
      {
        agentId: "ag-1",
        agentName: "Carlos Mora",
        primaryDepartmentId: "dept-1",
        primaryDepartmentName: "Soporte Técnico",
        role: "agent" as const,
        autoAssignEnabled: true,
        activeCasesNow: 2,
        maxCapacityThreshold: 5,
        casesAssigned: 30,
        casesCompleted: 28,
        casesTransferred: 2,
        avgFirstResponseTimeMs: 45000,
        avgHandlingTimeMinutes: 12.3,
        fcrRatePercentage: 88.5,
        avgCordialityScore: 94,
        criticalAlertsCount: 0,
        openCoachingNotesCount: 0,
      },
    ],
    filters: {
      from: "2026-10-10T00:00:00.000Z",
      to: "2026-11-09T23:59:59.000Z",
      departmentId: "dept-1",
    },
    departmentName: "Soporte Técnico",
  };

  it("construye un libro Excel con 3 hojas estructuradas", () => {
    const { wb, filename } = buildAnalyticsWorkbook(mockParams);

    expect(filename).toContain("reporte_operativo_soporte_tecnico_");
    expect(filename.endsWith(".xlsx")).toBe(true);

    expect(wb.SheetNames).toEqual([
      "Resumen Ejecutivo",
      "Rendimiento Asesores",
      "Motivos y Tráfico",
    ]);

    // Validar Hoja 1: Resumen Ejecutivo
    const sheet1 = wb.Sheets["Resumen Ejecutivo"]!;
    const rows1 = XLSX.utils.sheet_to_json<string[]>(sheet1, { header: 1 });
    expect(rows1[0]?.[0]).toContain("REPORTE EJECUTIVO DE OPERACIONES");
    expect(rows1[1]?.[1]).toBe("Soporte Técnico");

    // Validar Hoja 2: Rendimiento Asesores
    const sheet2 = wb.Sheets["Rendimiento Asesores"]!;
    const rows2 = XLSX.utils.sheet_to_json<string[]>(sheet2, { header: 1 });
    expect(rows2[0]).toContain("Asesor");
    expect(rows2[0]).toContain("FCR (% 1er Contacto)");
    expect(rows2[1]?.[0]).toBe("Carlos Mora");
    expect(rows2[1]?.[1]).toBe("Soporte Técnico");
    expect(rows2[1]?.[8]).toBe("88.5%");

    // Validar Hoja 3: Motivos y Tráfico
    const sheet3 = wb.Sheets["Motivos y Tráfico"]!;
    const rows3 = XLSX.utils.sheet_to_json<string[]>(sheet3, { header: 1 });
    expect(rows3[0]?.[0]).toContain("PRINCIPALES MOTIVOS DE ESCALAMIENTO");
  });

  it("genera un reporte global válido cuando no se especifica departamento", () => {
    const { wb, filename } = buildAnalyticsWorkbook({
      ...mockParams,
      departmentName: undefined,
      filters: { ...mockParams.filters, departmentId: undefined },
    });

    expect(filename).toContain("reporte_operativo_toda_la_empresa_global_");
    const sheet1 = wb.Sheets["Resumen Ejecutivo"]!;
    const rows1 = XLSX.utils.sheet_to_json<string[]>(sheet1, { header: 1 });
    expect(rows1[1]?.[1]).toBe("Toda la empresa (Global)");
  });
});
