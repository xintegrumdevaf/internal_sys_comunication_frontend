import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AnalyticsPrintReportModal } from "./AnalyticsPrintReportModal";
import * as exportService from "../application/analytics-export.service";

describe("AnalyticsPrintReportModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    overview: {
      totalCases: 120,
      activeCases: 10,
      completedCases: 110,
      botContainmentRate: 75.0,
      avgResolutionTimeMinutes: 8.5,
      avgQueueWaitTimeSeconds: 30,
      escalationRate: 25.0,
      escalatedCases: 30,
    },
    distribution: {
      totalCases: 120,
      byWorkflow: [
        { workflowType: "SUPPORT_INTERNET", count: 80, percentage: 66.7 },
        { workflowType: "BILLING_BALANCE", count: 40, percentage: 33.3 },
      ],
      byFinalStatus: [
        { status: "COMPLETED", count: 110, percentage: 91.7 },
        { status: "ESCALATED", count: 10, percentage: 8.3 },
      ],
      topEscalationReasons: [
        { reason: "REQUEST_HUMAN", workflowType: "SUPPORT_INTERNET", count: 15, percentage: 50.0 },
      ],
      hourlyDemand: [{ hour: 11, label: "11:00", count: 18 }],
      dailyTrend: [{ date: "2026-11-05", incoming: 20, resolved: 19 }],
    },
    aiEfficiency: {
      overallContainmentRate: 75.0,
      botCompletedCases: 90,
      humanEscalatedCases: 30,
      funnelDropOff: [],
      unclearTriageCount: 2,
    },
    agentsPerformance: [
      {
        agentId: "ag-10",
        agentName: "Elena Ramos",
        primaryDepartmentId: "dept-1",
        primaryDepartmentName: "Soporte Técnico",
        role: "agent" as const,
        autoAssignEnabled: true,
        activeCasesNow: 1,
        maxCapacityThreshold: 5,
        casesAssigned: 25,
        casesCompleted: 24,
        casesTransferred: 1,
        avgFirstResponseTimeMs: 25000,
        avgHandlingTimeMinutes: 7.2,
        fcrRatePercentage: 92.0,
        avgCordialityScore: 98,
        criticalAlertsCount: 0,
        openCoachingNotesCount: 0,
      },
    ],
    filters: {
      from: "2026-11-01T00:00:00.000Z",
      to: "2026-11-09T23:59:59.000Z",
      departmentId: "dept-1",
    },
    departmentName: "Soporte Técnico",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("no renderiza nada cuando isOpen es false", () => {
    const { container } = render(
      <AnalyticsPrintReportModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza el reporte ejecutivo con métricas, área, procesos y asesores cuando isOpen es true", () => {
    render(<AnalyticsPrintReportModal {...defaultProps} />);

    expect(screen.getByText(/Reporte Ejecutivo de Operaciones y Calidad/i)).toBeInTheDocument();
    expect(screen.getAllByText("Soporte Técnico").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("110")).toBeInTheDocument();
    expect(screen.getByText("75.0%")).toBeInTheDocument();
    expect(screen.getByText("Elena Ramos")).toBeInTheDocument();
  });

  it("invoca window.print al hacer clic en el botón Imprimir / PDF", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<AnalyticsPrintReportModal {...defaultProps} />);

    const printButton = screen.getByRole("button", { name: /Imprimir \/ PDF/i });
    fireEvent.click(printButton);

    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it("invoca exportAnalyticsToExcel al hacer clic en el botón Excel", () => {
    const exportSpy = vi
      .spyOn(exportService, "exportAnalyticsToExcel")
      .mockReturnValue("reporte.xlsx");

    render(<AnalyticsPrintReportModal {...defaultProps} />);

    const excelButton = screen.getByRole("button", { name: /Excel/i });
    fireEvent.click(excelButton);

    expect(exportSpy).toHaveBeenCalledTimes(1);
    expect(exportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        departmentName: "Soporte Técnico",
      })
    );
  });

  it("cierra el modal cuando se presiona la tecla Escape", () => {
    const onClose = vi.fn();
    render(<AnalyticsPrintReportModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cierra el modal al hacer clic en el botón Cerrar (X)", () => {
    const onClose = vi.fn();
    render(<AnalyticsPrintReportModal {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByTitle("Cerrar modal");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
