import { CheckCircle2, Clock, ListChecks, Sparkles, UserRound, Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CaseStatus,
  CaseSummaryDto,
  CaseTimelineEntryDto,
  SupportInternetDiagnosticTechnical,
} from "@/modules/cases/domain/case";
import {
  caseStatusLabel,
  caseStepLabel,
  caseStepStatusLabel,
  onuRunStateLabel,
  onuSignalQuality,
} from "@/modules/cases/domain/case";
import type { DepartmentDto } from "@/modules/identity/domain/department";

function isOnuTechnicalData(value: unknown): value is SupportInternetDiagnosticTechnical {
  return typeof value === "object" && value !== null;
}

function departmentDisplayName(slugOrName: string, departments: DepartmentDto[]): string {
  const bySlug = departments.find((d) => d.slug === slugOrName);
  return bySlug?.name ?? slugOrName;
}

const RESULT_KEY_LABELS: Record<string, string> = {
  hasDebt: "¿Tiene deuda?",
  debt: "Deuda",
  amount: "Monto",
  balance: "Saldo",
  diagnostic: "Diagnóstico",
  status: "Estado",
  question: "Pregunta al cliente",
  found: "¿Se encontró?",
  contracts: "Contratos encontrados",
  contractNumbers: "Cantidad de contratos",
};

function humanizeResultKey(key: string): string {
  if (RESULT_KEY_LABELS[key]) return RESULT_KEY_LABELS[key];
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function formatResultValue(value: unknown): string {
  if (value === true) return "Sí";
  if (value === false) return "No";
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Ventana de resumen de escalación (docs/spec/03_REALTIME_NOTIFICATIONS.md §4).
 * Contenido 100% real de GET /api/cases/:id/summary + /timeline — nada mockeado.
 */
export function CaseSummaryDialog({
  open,
  onOpenChange,
  summary,
  timeline,
  departments = [],
  onClaim,
  claimDisabled,
  claimLabel = "Reclamar este caso",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: CaseSummaryDto | null;
  timeline: CaseTimelineEntryDto[];
  /** Para mostrar el nombre real del área en vez del slug técnico ("support"). */
  departments?: DepartmentDto[];
  onClaim?: () => void;
  claimDisabled?: boolean;
  claimLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resumen del caso escalado</DialogTitle>
          <DialogDescription>
            Generado por el backend a partir del historial real del caso — no es un texto inventado
            por la IA.
          </DialogDescription>
        </DialogHeader>

        {!summary ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Cargando resumen…</p>
        ) : (
          (() => {
            const client = summary.results?.client as
              { fullName?: string; nationalId?: string } | undefined;
            const contract = summary.results?.contract as
              | { sector?: string; oltName?: string; pon?: string | number; serial?: string }
              | undefined;
            const balanceObj = summary.results?.balance as
              { hasDebt?: boolean; amount?: number } | undefined;
            const hasDebtVal =
              balanceObj?.hasDebt ?? (summary.results?.hasDebt as boolean | undefined);
            const debtAmountVal =
              balanceObj?.amount ??
              (summary.results?.debt as number | undefined) ??
              (summary.results?.amount as number | undefined);
            const hasDebt = hasDebtVal !== undefined ? Boolean(hasDebtVal) : undefined;
            const debtAmount = debtAmountVal != null ? Number(debtAmountVal) : undefined;

            const diagnostic = summary.results?.diagnostic as string | undefined;
            const technical = isOnuTechnicalData(summary.results?.technical)
              ? (summary.results.technical as SupportInternetDiagnosticTechnical)
              : undefined;
            const quality = technical
              ? onuSignalQuality(technical.opticalPowerDbm ?? undefined)
              : null;
            const otherResults = Object.entries(summary.results ?? {}).filter(
              ([key]) =>
                ![
                  "client",
                  "contract",
                  "balance",
                  "diagnostic",
                  "technical",
                  "hasDebt",
                  "debt",
                  "amount",
                  "nationalId",
                  "fullName",
                  "sector",
                  "oltName",
                  "pon",
                  "serial",
                ].includes(key),
            );
            return (
              <div className="space-y-4 text-sm">
                {summary.readableSummary && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-[13px] leading-relaxed">
                    {summary.readableSummary}
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide">
                      Redactado por IA · no reemplaza los datos de abajo
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">
                      Problema
                    </p>
                    <p className="font-semibold mt-0.5">{summary.problem}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">
                      Área responsable
                    </p>
                    <p className="font-semibold mt-0.5">
                      {departmentDisplayName(summary.department, departments)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Estado</p>
                    <p className="font-semibold mt-0.5">
                      {caseStatusLabel(summary.status as CaseStatus)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">
                      Razón / Motivo
                    </p>
                    <p className="font-semibold mt-0.5">{summary.reason}</p>
                  </div>
                </div>

                {summary.completedSteps.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ListChecks className="size-3.5" /> Pasos completados
                    </h4>
                    <ul className="space-y-1">
                      {summary.completedSteps.map((step) => (
                        <li key={step} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                          {caseStepLabel(step)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(client || contract) && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <UserRound className="size-3.5" /> Cliente y Contrato
                    </h4>
                    <div className="rounded-lg border border-border divide-y divide-border text-xs">
                      {client?.fullName && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Nombre</span>
                          <span className="text-right font-semibold">{client.fullName}</span>
                        </div>
                      )}
                      {client?.nationalId && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Cédula / DNI</span>
                          <span className="text-right font-medium">{client.nationalId}</span>
                        </div>
                      )}
                      {contract?.sector && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Sector</span>
                          <span className="text-right font-medium">{contract.sector}</span>
                        </div>
                      )}
                      {contract?.oltName && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">OLT</span>
                          <span className="text-right font-medium">{contract.oltName}</span>
                        </div>
                      )}
                      {contract?.pon !== undefined && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">PON</span>
                          <span className="text-right font-medium">{String(contract.pon)}</span>
                        </div>
                      )}
                      {contract?.serial && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Serial</span>
                          <span className="text-right font-medium font-mono">
                            {contract.serial}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(diagnostic || hasDebt !== undefined || debtAmount != null) && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles className="size-3.5" /> Diagnóstico y Estado
                    </h4>
                    <div className="rounded-lg border border-border divide-y divide-border text-xs">
                      {diagnostic && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Diagnóstico</span>
                          <span className="text-right font-bold text-primary">{diagnostic}</span>
                        </div>
                      )}
                      {(hasDebt !== undefined || debtAmount != null) && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Deuda</span>
                          <span className="text-right font-medium">
                            {hasDebt ? `Sí ($${debtAmount ?? 0})` : "No"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {technical && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Wrench className="size-3.5" /> Telemetría del Equipo (ONU)
                    </h4>
                    <div className="rounded-lg border border-border divide-y divide-border text-xs">
                      {technical.brand && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Marca</span>
                          <span className="text-right font-medium">{technical.brand}</span>
                        </div>
                      )}
                      {(technical.phaseState || technical.runState) && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Estado de fase / ONU</span>
                          <span className="text-right font-medium">
                            {technical.phaseState || onuRunStateLabel(technical.runState)}
                          </span>
                        </div>
                      )}
                      {technical.adminState && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Estado administrativo</span>
                          <span className="text-right font-medium">{technical.adminState}</span>
                        </div>
                      )}
                      {(technical.onuIndex || technical.stateOnuIndex) && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Índice ONU</span>
                          <span className="text-right font-medium font-mono">
                            {technical.onuIndex || technical.stateOnuIndex}
                          </span>
                        </div>
                      )}
                      {technical.omccState && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">OMCC</span>
                          <span className="text-right font-medium">{technical.omccState}</span>
                        </div>
                      )}
                      {technical.channel && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Canal GPON</span>
                          <span className="text-right font-medium">{technical.channel}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-3 px-3 py-1.5">
                        <span className="text-muted-foreground">Potencia óptica</span>
                        <span className="text-right font-medium flex items-center gap-1.5 justify-end">
                          {technical.opticalPowerDbm != null
                            ? `${technical.opticalPowerDbm.toFixed(1)} dBm`
                            : "N/A"}
                          {quality && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${quality.cls}`}
                            >
                              {quality.label}
                            </span>
                          )}
                        </span>
                      </div>
                      {technical.onuModel && technical.onuModel !== "unknown" && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Modelo de ONU</span>
                          <span className="text-right font-medium">{technical.onuModel}</span>
                        </div>
                      )}
                      {technical.onuSerial && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Serial ONU</span>
                          <span className="text-right font-medium font-mono">
                            {technical.onuSerial}
                          </span>
                        </div>
                      )}
                      {technical.macAddress && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">MAC</span>
                          <span className="text-right font-medium">{technical.macAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {otherResults.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Otros Resultados
                    </h4>
                    <div className="rounded-lg border border-border divide-y divide-border text-xs">
                      {otherResults.map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">{humanizeResultKey(key)}</span>
                          <span className="text-right break-all font-medium">
                            {formatResultValue(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs">
                  <span className="font-bold">Acción pendiente:</span> {summary.pendingAction}
                </div>

                {timeline.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Clock className="size-3.5" /> Línea de tiempo
                    </h4>
                    <ol className="space-y-1.5 text-[11px] font-mono max-h-40 overflow-y-auto">
                      {timeline.map((entry, i) => (
                        <li key={i} className="flex justify-between gap-2">
                          <span className="truncate">{caseStepLabel(entry.action)}</span>
                          <span className="text-muted-foreground shrink-0">
                            {caseStepStatusLabel(entry.status)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {onClaim && (
                  <button
                    type="button"
                    disabled={claimDisabled}
                    onClick={onClaim}
                    className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-xs font-bold uppercase disabled:opacity-40"
                  >
                    {claimLabel}
                  </button>
                )}
              </div>
            );
          })()
        )}
      </DialogContent>
    </Dialog>
  );
}
