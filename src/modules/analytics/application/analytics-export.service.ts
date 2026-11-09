import * as XLSX from "xlsx";
import type {
  AnalyticsOverviewDto,
  CasesDistributionDto,
  AIEfficiencyDto,
  AgentPerformanceDto,
} from "../domain/analytics.types";
import type { DepartmentDto } from "@/modules/identity/domain/department";
import {
  formatWorkflow,
  formatEscalationReason,
  formatDurationSeconds,
  formatDurationMinutes,
} from "../domain/analytics-translations";

export interface AnalyticsExportParams {
  overview?: AnalyticsOverviewDto;
  distribution?: CasesDistributionDto;
  aiEfficiency?: AIEfficiencyDto;
  agentsPerformance?: AgentPerformanceDto[];
  departments?: DepartmentDto[];
  filters: { from?: string; to?: string; departmentId?: string };
  departmentName?: string;
}

function formatDate(iso?: string): string {
  if (!iso) return "N/D";
  try {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString("es-EC", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
  } catch {
    return iso;
  }
}

/**
 * Construye el libro de trabajo Excel multi-pestaña con el reporte ejecutivo
 * de analítica operativa, calidad, productividad y capacidad instalada.
 */
export function buildAnalyticsWorkbook(params: AnalyticsExportParams): {
  wb: XLSX.WorkBook;
  filename: string;
} {
  const {
    overview,
    distribution,
    aiEfficiency,
    agentsPerformance = [],
    departments = [],
    filters,
    departmentName,
  } = params;
  const wb = XLSX.utils.book_new();

  const areaLabel = departmentName || "Toda la empresa (Global)";
  const fromFormatted = formatDate(filters.from);
  const toFormatted = formatDate(filters.to);
  const generatedAt = new Date().toLocaleString("es-EC");

  // ==========================================
  // HOJA 1: RESUMEN EJECUTIVO Y MACRO KPIS
  // ==========================================
  const summaryRows: (string | number)[][] = [
    ["REPORTE EJECUTIVO DE OPERACIONES Y ANALÍTICA - ISP"],
    ["Área / Departamento:", areaLabel],
    ["Período Evaluado:", `Desde: ${fromFormatted} | Hasta: ${toFormatted}`],
    ["Fecha de Generación:", generatedAt],
    [],
    ["1. INDICADORES CLAVE DE DESEMPEÑO (MACRO KPIs)"],
    ["Métrica", "Valor", "Unidad / Detalle"],
    ["Total de Casos Gestionados", overview?.totalCases ?? 0, "Casos"],
    ["Casos Activos en Curso", overview?.activeCases ?? 0, "Casos"],
    ["Casos Resueltos / Completados", overview?.completedCases ?? 0, "Casos"],
    ["Tasa de Contención de IA", `${overview?.botContainmentRate?.toFixed(1) ?? 0}%`, "Resueltos sin intervención humana"],
    ["Tasa de Escalamiento a Humano", `${overview?.escalationRate?.toFixed(1) ?? 0}%`, "Derivados a agentes"],
    ["Tiempo Promedio de Resolución", overview?.avgResolutionTimeMinutes ? Number(overview.avgResolutionTimeMinutes.toFixed(1)) : 0, "Minutos"],
    ["Tiempo Promedio de Espera en Cola", overview?.avgQueueWaitTimeSeconds ? Number(overview.avgQueueWaitTimeSeconds.toFixed(0)) : 0, "Segundos"],
    ["Casos Escalados a Asesor", overview?.escalatedCases ?? (aiEfficiency?.humanEscalatedCases ?? 0), "Casos"],
    ["Casos Resueltos 100% por IA", aiEfficiency?.botCompletedCases ?? 0, "Casos"],
    ["Casos Sin Asignar en Cola", overview?.unassignedCases ?? 0, "Casos"],
    ["Casos Desatendidos (Alerta)", overview?.unattendedCases ?? 0, "Casos"],
    [],
    ["2. DISTRIBUCIÓN POR PROCESO (WORKFLOW)"],
    ["Proceso / Workflow", "Casos", "Participación (%)"],
  ];

  if (distribution?.byWorkflow && distribution.byWorkflow.length > 0) {
    for (const item of distribution.byWorkflow) {
      summaryRows.push([
        formatWorkflow(item.workflowType),
        item.count,
        `${item.percentage.toFixed(1)}%`,
      ]);
    }
  } else {
    summaryRows.push(["Sin datos de procesos en el período", 0, "0.0%"]);
  }

  summaryRows.push([], ["3. DISTRIBUCIÓN POR ESTADO FINAL"], ["Estado", "Casos", "Participación (%)"]);
  if (distribution?.byFinalStatus && distribution.byFinalStatus.length > 0) {
    for (const item of distribution.byFinalStatus) {
      summaryRows.push([item.status, item.count, `${item.percentage.toFixed(1)}%`]);
    }
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 38 }, { wch: 18 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen Ejecutivo");

  // ==========================================
  // HOJA 2: CAPACIDAD Y SATURACIÓN POR ÁREA
  // ==========================================
  if (departments.length > 0) {
    const capacityHeaders = [
      "Área / Departamento",
      "Asesores Totales",
      "Asesores en Turno",
      "Cupo Máx / Asesor",
      "Capacidad Total Instalada",
      "Casos Activos Ahora",
      "Ocupación / Saturación",
      "Estado Operativo",
    ];

    const capacityRows = departments
      .filter((d) => d.active)
      .map((d) => {
        const deptAgents = agentsPerformance.filter((a) => a.primaryDepartmentId === d.id);
        const onShiftCount = deptAgents.filter((a) => a.autoAssignEnabled).length;
        const maxPerAgent = d.maxConcurrentCases || 6;
        const totalCapacity = onShiftCount * maxPerAgent;
        const activeHandled = deptAgents.reduce((acc, a) => acc + (a.activeCasesNow || 0), 0);
        const occupancyPct =
          totalCapacity > 0
            ? Math.min(Math.round((activeHandled / totalCapacity) * 100), 100)
            : activeHandled > 0
              ? 100
              : 0;

        let statusLabel = "Disponible";
        if (totalCapacity === 0 && deptAgents.length === 0) statusLabel = "Sin personal";
        else if (occupancyPct >= 85 || (totalCapacity === 0 && activeHandled > 0)) statusLabel = "Saturado";
        else if (occupancyPct >= 60) statusLabel = "Moderado";

        return [
          d.name,
          deptAgents.length,
          onShiftCount,
          maxPerAgent,
          totalCapacity,
          activeHandled,
          `${occupancyPct}%`,
          statusLabel,
        ];
      });

    const wsCapacity = XLSX.utils.aoa_to_sheet([capacityHeaders, ...capacityRows]);
    wsCapacity["!cols"] = [
      { wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      { wch: 24 }, { wch: 20 }, { wch: 22 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsCapacity, "Capacidad y Saturación");
  }

  // ==========================================
  // HOJA 3: RENDIMIENTO INDIVIDUAL DE ASESORES
  // ==========================================
  const agentHeaders = [
    "Asesor", "Departamento", "Rol", "Casos Asignados", "Casos Resueltos", "Casos Derivados",
    "T. Primera Respuesta", "T. Medio Atención (min)", "FCR (% 1er Contacto)",
    "Cordialidad (0-100)", "Casos Activos Ahora", "Alertas Críticas", "Auto-Asignación",
  ];

  const agentRows = agentsPerformance.map((a) => {
    const roleMap: Record<string, string> = { agent: "Asesor", manager: "Supervisor", admin: "Administrador" };
    const firstReply = a.avgFirstResponseTimeMs ? formatDurationSeconds(Math.round(a.avgFirstResponseTimeMs / 1000)) : "-";
    const handlingTime = a.avgHandlingTimeMinutes ? formatDurationMinutes(a.avgHandlingTimeMinutes) : "-";
    const fcr = a.fcrRatePercentage !== null && a.fcrRatePercentage !== undefined && a.casesAssigned > 0
      ? `${a.fcrRatePercentage.toFixed(1)}%`
      : "-";
    const cordiality = a.avgCordialityScore !== null && a.avgCordialityScore !== undefined
      ? Number(a.avgCordialityScore.toFixed(0))
      : "-";

    return [
      a.agentName,
      a.primaryDepartmentName || "Sin asignar",
      roleMap[a.role] || a.role,
      a.casesAssigned,
      a.casesCompleted,
      a.casesTransferred,
      firstReply,
      handlingTime,
      fcr,
      cordiality,
      a.activeCasesNow,
      a.criticalAlertsCount,
      a.autoAssignEnabled ? "Sí" : "No",
    ];
  });

  const wsAgents = XLSX.utils.aoa_to_sheet([agentHeaders, ...agentRows]);
  wsAgents["!cols"] = [
    { wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAgents, "Rendimiento Asesores");

  // ==========================================
  // HOJA 4: MOTIVOS, CAUSA RAÍZ Y TRÁFICO
  // ==========================================
  const detailsRows: (string | number)[][] = [
    ["1. PRINCIPALES MOTIVOS DE ESCALAMIENTO / CONSULTA"],
    ["Motivo / Causa Raíz", "Proceso", "Casos", "Porcentaje (%)"],
  ];

  if (distribution?.topEscalationReasons && distribution.topEscalationReasons.length > 0) {
    for (const r of distribution.topEscalationReasons) {
      detailsRows.push([
        formatEscalationReason(r.reason),
        formatWorkflow(r.workflowType),
        r.count,
        `${r.percentage.toFixed(1)}%`,
      ]);
    }
  } else {
    detailsRows.push(["Sin escalamientos registrados", "N/D", 0, "0.0%"]);
  }

  detailsRows.push([], ["2. DEMANDA Y TRÁFICO POR HORA DEL DÍA"], ["Hora", "Etiqueta", "Casos Registrados"]);
  if (distribution?.hourlyDemand && distribution.hourlyDemand.length > 0) {
    for (const h of distribution.hourlyDemand) {
      detailsRows.push([h.hour, h.label, h.count]);
    }
  }

  detailsRows.push([], ["3. TENDENCIA DIARIA (RITMO DE ENTRADA VS RESOLUCIÓN)"], ["Fecha", "Casos Ingresados", "Casos Resueltos"]);
  if (distribution?.dailyTrend && distribution.dailyTrend.length > 0) {
    for (const d of distribution.dailyTrend) {
      detailsRows.push([d.date, d.incoming, d.resolved]);
    }
  }

  const wsDetails = XLSX.utils.aoa_to_sheet(detailsRows);
  wsDetails["!cols"] = [{ wch: 38 }, { wch: 24 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsDetails, "Motivos y Tráfico");

  // Nombre de archivo sanitizado
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanArea = areaLabel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const filename = `reporte_operativo_${cleanArea}_${dateStr}.xlsx`;

  return { wb, filename };
}

/**
 * Descarga directamente el reporte Excel en el navegador.
 */
export function exportAnalyticsToExcel(params: AnalyticsExportParams): string {
  const { wb, filename } = buildAnalyticsWorkbook(params);
  XLSX.writeFile(wb, filename);
  return filename;
}
