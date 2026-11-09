import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Printer, FileSpreadsheet } from "lucide-react";
import type {
  AnalyticsOverviewDto,
  CasesDistributionDto,
  AIEfficiencyDto,
  AgentPerformanceDto,
  AnalyticsFilterParams,
} from "../domain/analytics.types";
import {
  formatWorkflow,
  formatEscalationReason,
  formatDurationSeconds,
  formatDurationMinutes,
} from "../domain/analytics-translations";
import { exportAnalyticsToExcel } from "../application/analytics-export.service";

export interface AnalyticsPrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  overview?: AnalyticsOverviewDto;
  distribution?: CasesDistributionDto;
  aiEfficiency?: AIEfficiencyDto;
  agentsPerformance?: AgentPerformanceDto[];
  filters: AnalyticsFilterParams;
  departmentName?: string;
}

function formatDateLabel(iso?: string): string {
  if (!iso) return "-";
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

export function AnalyticsPrintReportModal({
  isOpen,
  onClose,
  overview,
  distribution,
  aiEfficiency,
  agentsPerformance = [],
  filters,
  departmentName,
}: AnalyticsPrintReportModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Consolidar motivos idénticos para no duplicar filas en la vista ejecutiva
  const consolidatedReasons = useMemo(() => {
    if (!distribution?.topEscalationReasons) return [];
    const map = new Map<string, { reason: string; count: number }>();
    let totalCount = 0;
    for (const r of distribution.topEscalationReasons) {
      const key = r.reason.trim();
      const prev = map.get(key) || { reason: key, count: 0 };
      prev.count += r.count;
      map.set(key, prev);
      totalCount += r.count;
    }
    return Array.from(map.values())
      .map((item) => ({
        ...item,
        percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [distribution?.topEscalationReasons]);

  // Ordenar asesores por actividad (mayor a menor)
  const sortedAgents = useMemo(() => {
    return [...agentsPerformance].sort((a, b) => {
      if (b.casesAssigned !== a.casesAssigned) return b.casesAssigned - a.casesAssigned;
      return b.casesCompleted - a.casesCompleted;
    });
  }, [agentsPerformance]);

  if (!isOpen || !mounted) return null;

  const areaLabel = departmentName || "Toda la empresa (Global)";
  const periodLabel = `Desde: ${formatDateLabel(filters.from)} | Hasta: ${formatDateLabel(filters.to)}`;
  const generatedAt = new Date().toLocaleString("es-EC", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => window.print();
  const handleExcelExport = () => {
    exportAnalyticsToExcel({
      overview,
      distribution,
      aiEfficiency,
      agentsPerformance: sortedAgents,
      filters,
      departmentName,
    });
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 md:p-6 print:p-0 print:bg-white print:static print:inset-auto print:block">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #analytics-printable-report, #analytics-printable-report * { visibility: visible !important; }
          #analytics-printable-report {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 100% !important; margin: 0 !important; padding: 24px !important;
            background: #ffffff !important; color: #0f172a !important; font-size: 11px !important;
            box-shadow: none !important; border: none !important;
          }
          .no-print { display: none !important; }
          .avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
        }
      `}</style>

      {/* Contenedor Principal Flotante Centrado (max-h 84vh) */}
      <div className="relative w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl bg-card rounded-xl sm:rounded-2xl border border-border shadow-2xl flex flex-col max-h-[84vh] text-foreground print:max-h-none print:overflow-visible print:p-0 print:border-none print:shadow-none print:bg-white print:text-slate-900 overflow-hidden">
        {/* Barra superior de controles */}
        <div className="no-print shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4.5 border-b border-border/70 bg-card">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground">Vista Previa del Reporte Operativo</h2>
            <p className="text-xs text-muted-foreground">Ajusta e imprime o guarda directamente en formato PDF o Excel.</p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExcelExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="size-4 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="size-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Cerrar modal"
              className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Cuerpo scrolleable del informe */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div id="analytics-printable-report" className="space-y-6">
            {/* Encabezado Membretado */}
            <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">
                  ISP Telecomunicaciones • Plataforma Omnicanal
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                  Reporte Ejecutivo de Operaciones y Calidad
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Área Evaluada: <strong className="text-slate-900">{areaLabel}</strong>
                </p>
              </div>
              <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5 shrink-0">
                <p><strong>Período:</strong> {periodLabel}</p>
                <p><strong>Emisión:</strong> {generatedAt}</p>
              </div>
            </div>

            {/* 1. Indicadores Clave de Desempeño (KPIs) */}
            <div className="space-y-2.5 avoid-break">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-l-3 border-sky-600 pl-2">
                1. Indicadores Clave de Desempeño (Macro KPIs)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Casos</span>
                  <p className="text-lg font-bold text-slate-900">{overview?.totalCases ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Completados / Resueltos</span>
                  <p className="text-lg font-bold text-emerald-700">{overview?.completedCases ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Contención IA</span>
                  <p className="text-lg font-bold text-sky-700">{overview?.botContainmentRate?.toFixed(1) ?? "0.0"}%</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Tasa Escalamiento</span>
                  <p className="text-lg font-bold text-amber-700">{overview?.escalationRate?.toFixed(1) ?? "0.0"}%</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Tiempo Resolución</span>
                  <p className="text-lg font-bold text-slate-900">
                    {overview?.avgResolutionTimeMinutes != null && overview.avgResolutionTimeMinutes > 0
                      ? `${formatDurationMinutes(overview.avgResolutionTimeMinutes)} (${overview.avgResolutionTimeMinutes.toFixed(1)}m)`
                      : "0m"}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Espera en Cola</span>
                  <p className="text-lg font-bold text-slate-900">
                    {overview?.avgQueueWaitTimeSeconds != null && overview.avgQueueWaitTimeSeconds > 0
                      ? formatDurationSeconds(overview.avgQueueWaitTimeSeconds)
                      : "0 seg (inmediato)"}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Casos Activos</span>
                  <p className="text-lg font-bold text-slate-900">{overview?.activeCases ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Resueltos 100% IA</span>
                  <p className="text-lg font-bold text-slate-900">{aiEfficiency?.botCompletedCases ?? 0}</p>
                </div>
              </div>
            </div>

            {/* 2. Distribución por Proceso y Causas de Escalamiento Consolidada */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 avoid-break">
              {/* Procesos */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-l-3 border-sky-600 pl-2">
                  2. Distribución por Proceso
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[280px]">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-3">Proceso</th>
                        <th className="py-1.5 px-3 text-right">Casos</th>
                        <th className="py-1.5 px-3 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {distribution?.byWorkflow && distribution.byWorkflow.length > 0 ? (
                        distribution.byWorkflow.map((item) => (
                          <tr key={item.workflowType}>
                            <td className="py-1 px-3 text-slate-800">{formatWorkflow(item.workflowType)}</td>
                            <td className="py-1 px-3 text-right font-medium text-slate-700">{item.count}</td>
                            <td className="py-1 px-3 text-right text-slate-500">{item.percentage.toFixed(1)}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={3} className="py-2 px-3 text-center text-slate-400">Sin datos de procesos</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Motivos de Escalamiento Consolidados (Sin filas repetidas) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-l-3 border-sky-600 pl-2">
                  3. Motivos de Escalamiento a Asesor
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[300px]">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-3">Motivo</th>
                        <th className="py-1.5 px-3 text-right">Casos</th>
                        <th className="py-1.5 px-3 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {consolidatedReasons.length > 0 ? (
                        consolidatedReasons.slice(0, 5).map((r, idx) => (
                          <tr key={`${r.reason}-${idx}`}>
                            <td className="py-1 px-3 text-slate-800 truncate max-w-[170px]">
                              {formatEscalationReason(r.reason)}
                            </td>
                            <td className="py-1 px-3 text-right font-medium text-slate-700">{r.count}</td>
                            <td className="py-1 px-3 text-right text-slate-500">{r.percentage.toFixed(1)}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={3} className="py-2 px-3 text-center text-slate-400">Sin escalamientos registrados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. Rendimiento del Equipo de Asesores (Formato Humano sin N/D) */}
            <div className="space-y-2 avoid-break">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-l-3 border-sky-600 pl-2">
                4. Rendimiento Individual de Asesores
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[640px] sm:min-w-full">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-3">Asesor</th>
                      <th className="py-1.5 px-2">Depto</th>
                      <th className="py-1.5 px-2 text-right">Asignados</th>
                      <th className="py-1.5 px-2 text-right">Resueltos</th>
                      <th className="py-1.5 px-2 text-right">1ra Resp.</th>
                      <th className="py-1.5 px-2 text-right">T. Atención</th>
                      <th className="py-1.5 px-2 text-right">FCR %</th>
                      <th className="py-1.5 px-2 text-right">Cordialidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedAgents.length > 0 ? (
                      sortedAgents.map((a) => (
                        <tr key={a.agentId}>
                          <td className="py-1 px-3 font-medium text-slate-800 truncate max-w-[140px]">{a.agentName}</td>
                          <td className="py-1 px-2 text-slate-600 truncate max-w-[110px]">{a.primaryDepartmentName || "Sin asignar"}</td>
                          <td className="py-1 px-2 text-right text-slate-700">{a.casesAssigned}</td>
                          <td className="py-1 px-2 text-right font-semibold text-emerald-700">{a.casesCompleted}</td>
                          <td className="py-1 px-2 text-right text-slate-600">
                            {a.avgFirstResponseTimeMs ? formatDurationSeconds(Math.round(a.avgFirstResponseTimeMs / 1000)) : "-"}
                          </td>
                          <td className="py-1 px-2 text-right text-slate-600">
                            {a.avgHandlingTimeMinutes ? formatDurationMinutes(a.avgHandlingTimeMinutes) : "-"}
                          </td>
                          <td className="py-1 px-2 text-right text-slate-700">
                            {a.fcrRatePercentage !== null && a.fcrRatePercentage !== undefined && a.casesAssigned > 0
                              ? `${a.fcrRatePercentage.toFixed(1)}%`
                              : "-"}
                          </td>
                          <td className="py-1 px-2 text-right font-medium text-slate-800">
                            {a.avgCordialityScore !== null && a.avgCordialityScore !== undefined
                              ? `${a.avgCordialityScore.toFixed(0)}/100`
                              : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={8} className="py-2.5 px-3 text-center text-slate-400">No hay datos de asesores</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pie de Página */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-[10px] text-slate-500">
              <span>Generado automáticamente por el Sistema Omnicanal de Comunicaciones</span>
              <span>Documento Confidencial de Gestión Interna</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
