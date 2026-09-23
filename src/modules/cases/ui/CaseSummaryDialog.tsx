import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileCode2,
  HelpCircle,
  ListChecks,
  Network,
  Sparkles,
  Terminal,
  UserRound,
  Wrench,
} from "lucide-react";
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
  findingTypeLabel,
  formatMacAddress,
  formatOpticalPower,
  humanizeCaseReason,
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
  clientName: "Nombre del cliente",
  creationTime: "Fecha de registro",
  canBeReactivated: "¿Puede reactivarse?",
  rawOutput: "Salida de consola MikroTik",
  ip: "Dirección IP",
  list: "Lista en router",
  reason: "Detalle",
  estado: "Estado",
};

function humanizeResultKey(key: string): string {
  if (RESULT_KEY_LABELS[key]) return RESULT_KEY_LABELS[key];
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

type ContractCardItem = {
  id?: string;
  contractCode?: string;
  name?: string;
  label?: string;
  address?: string;
  status?: string;
  ip?: string;
  router?: {
    ip?: string;
    pon?: string | number;
    sector?: string;
    serial?: string;
    olt_name?: string;
  };
  sector?: string;
  serial?: string;
  oltName?: string;
};

function parseContractsData(value: unknown): ContractCardItem[] | null {
  let candidate = value;
  if (typeof value === "string") {
    try {
      candidate = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (Array.isArray(candidate) && candidate.length > 0 && typeof candidate[0] === "object") {
    return candidate as ContractCardItem[];
  }
  return null;
}

function renderValueFriendly(key: string, value: unknown) {
  if (value === true)
    return <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sí</span>;
  if (value === false) return <span className="font-semibold text-muted-foreground">No</span>;
  if (value === null || value === undefined)
    return <span className="text-muted-foreground">—</span>;

  // Si es la salida cruda de consola
  if (key === "rawOutput" || key.toLowerCase().includes("output")) {
    return (
      <details className="w-full group mt-1">
        <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 py-1">
          <Terminal className="size-3 text-muted-foreground" />
          <span>Ver consola técnica MikroTik RouterOS</span>
          <span className="text-[10px] text-muted-foreground/60">(clic para ver)</span>
        </summary>
        <pre className="mt-2 p-2.5 bg-muted/60 border border-border rounded-md font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-48 text-foreground/90">
          {String(value)}
        </pre>
      </details>
    );
  }

  // Contratos encontrados
  const parsedContracts = parseContractsData(value);
  if (parsedContracts) {
    return (
      <div className="space-y-2 mt-1 w-full">
        {parsedContracts.map((c, i) => (
          <div
            key={c.id || c.contractCode || i}
            className="p-2.5 bg-muted/30 border border-border rounded-lg text-xs space-y-1"
          >
            <div className="flex justify-between items-center gap-2">
              <span className="font-bold flex items-center gap-1">
                <Network className="size-3 text-primary" />
                Contrato #{c.contractCode || c.id || i + 1}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                  (c.status || "").toUpperCase() === "ACTIVO" ||
                  (c.status || "").toUpperCase() === "HABILITADO"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c.status || "REGISTRADO"}
              </span>
            </div>
            {(c.address || c.label) && (
              <p className="text-[11px] text-muted-foreground leading-snug">
                {c.address || c.label}
              </p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] pt-1 text-muted-foreground font-mono">
              {(c.router?.sector || c.sector) && (
                <span>
                  Sector: <b className="text-foreground">{c.router?.sector || c.sector}</b>
                </span>
              )}
              {(c.router?.olt_name || c.oltName) && (
                <span>
                  OLT: <b className="text-foreground">{c.router?.olt_name || c.oltName}</b>
                </span>
              )}
              {c.router?.pon !== undefined && (
                <span>
                  PON: <b className="text-foreground">{String(c.router.pon)}</b>
                </span>
              )}
              {(c.router?.serial || c.serial) && (
                <span>
                  Serial: <b className="text-foreground">{c.router?.serial || c.serial}</b>
                </span>
              )}
              {(c.router?.ip || c.ip) && (
                <span>
                  IP: <b className="text-foreground">{c.router?.ip || c.ip}</b>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Si es un objeto genérico o string con JSON
  if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        if ("message" in parsed || "error" in parsed) {
          const msg =
            (parsed as { message?: string; error?: string; code?: string }).message ||
            (parsed as { error?: string }).error;
          const code = (parsed as { code?: string }).code;
          return (
            <span className="font-semibold text-foreground">
              {msg} {code ? `(${code})` : ""}
            </span>
          );
        }
      }
    } catch {
      // Ignorar error de parseo y renderizar como string
    }
  }

  if (typeof value === "object") {
    return (
      <div className="bg-muted/40 p-2 rounded text-[11px] space-y-1 w-full">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{humanizeResultKey(k)}:</span>
            <span className="font-medium text-foreground text-right">{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <span className="font-medium text-foreground">{String(value)}</span>;
}

/**
 * Ventana de resumen de caso y escalación.
 * Diseñada para ser 100% responsiva y amigable a operadores sin jerga técnica cruda.
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
      <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Detalles y resumen del caso</DialogTitle>
          <DialogDescription className="text-xs">
            Generado por el sistema a partir del historial real del caso — sin datos inventados por
            IA.
          </DialogDescription>
        </DialogHeader>

        {!summary ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando detalles del caso…</p>
          </div>
        ) : (
          (() => {
            const client = summary.results?.client as
              { fullName?: string; nationalId?: string } | undefined;
            const firstContract = Array.isArray(summary.results?.contracts)
              ? summary.results.contracts[0]
              : undefined;
            const contract = (summary.results?.contract ?? firstContract) as
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

            const diagnostic = summary.results?.diagnostic as
              | {
                  status?: string;
                  result?: string;
                  findings?: Array<{ type?: string; severity?: string; description?: string }>;
                  instruction?: string;
                  actions?: Array<{ type?: string }>;
                }
              | string
              | undefined;
            const diagnosticResult =
              typeof diagnostic === "string"
                ? diagnostic
                : (diagnostic?.result ?? diagnostic?.status);
            const findings = typeof diagnostic === "object" ? diagnostic?.findings : undefined;
            const instruction =
              typeof diagnostic === "object"
                ? diagnostic?.instruction
                : (summary.results?.instruction as string | undefined);

            const rawTech = summary.results?.technical as Record<string, unknown> | undefined;
            const technical = isOnuTechnicalData(summary.results?.technical)
              ? (summary.results.technical as SupportInternetDiagnosticTechnical)
              : undefined;

            // Telemetría con soporte unificado (normalizado o crudo)
            const brand = technical?.brand || (rawTech?.brand as string | undefined);
            const onuModel =
              technical?.onuModel ||
              ((rawTech?.onu as Record<string, unknown> | undefined)?.model as string | undefined);
            const onuSerial =
              technical?.onuSerial ||
              ((rawTech?.onu as Record<string, unknown> | undefined)?.authinfo as
                string | undefined) ||
              ((rawTech?.onu as Record<string, unknown> | undefined)?.serial as string | undefined);
            const onuIndex =
              technical?.onuIndex ||
              ((rawTech?.onu as Record<string, unknown> | undefined)?.onuindex as
                string | undefined) ||
              technical?.stateOnuIndex ||
              ((rawTech?.state as Record<string, unknown> | undefined)?.onuIndex as
                string | undefined);
            const phaseState =
              technical?.phaseState ||
              ((rawTech?.state as Record<string, unknown> | undefined)?.phaseState as
                string | undefined);
            const runState =
              technical?.runState ||
              ((rawTech?.state as Record<string, unknown> | undefined)?.runState as
                string | undefined);
            const adminState =
              technical?.adminState ||
              ((rawTech?.state as Record<string, unknown> | undefined)?.adminState as
                string | undefined);
            const omccState =
              technical?.omccState ||
              ((rawTech?.state as Record<string, unknown> | undefined)?.omccState as
                string | undefined);
            const channel =
              technical?.channel ||
              ((rawTech?.state as Record<string, unknown> | undefined)?.channel as
                string | undefined);

            const powerVal =
              technical?.opticalPowerDbm !== undefined
                ? technical.opticalPowerDbm
                : (rawTech?.power as number | null | undefined);
            const macVal =
              technical?.macAddress !== undefined
                ? technical.macAddress
                : (rawTech?.mac as string | null | undefined);

            const powerFormatted = formatOpticalPower(powerVal);
            const macFormatted = formatMacAddress(macVal);
            const quality = powerFormatted.isMeasured ? onuSignalQuality(powerVal) : null;

            const isSupportCase =
              summary.workflow === "SUPPORT_INTERNET" ||
              (summary.workflow || "").toUpperCase().includes("SUPPORT") ||
              (summary.workflow || "").toUpperCase().includes("INTERNET") ||
              (summary.department || "").toLowerCase().includes("support") ||
              (summary.department || "").toLowerCase().includes("soporte") ||
              (summary.problem || "").toLowerCase().includes("internet") ||
              Boolean(contract?.serial || contract?.oltName);

            const isDiagnosticFailed =
              summary.timeline?.some(
                (t) =>
                  (t.action === "DIAGNOSTIC" || t.action === "CONTINUE_DIAGNOSTIC") &&
                  t.status === "FAILED",
              ) || timeline?.some((t) => t.action === "DIAGNOSTIC" && t.status === "FAILED");

            const rawHistory =
              rawTech?._history ||
              (technical as { _history?: unknown[] })?._history ||
              (summary.results as { _history?: unknown[] })?._history;
            const historySteps = Array.isArray(rawHistory)
              ? (rawHistory as Array<{
                  step?: string;
                  command?: string;
                  raw?: string;
                  success?: boolean;
                }>)
              : [];

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
                  "findings",
                  "instruction",
                  "actions",
                  "workflow",
                  "_history",
                ].includes(key),
            );

            const humanizedReason = humanizeCaseReason(summary.reason);

            return (
              <div className="space-y-4 text-sm">
                {summary.readableSummary && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-[13px] leading-relaxed">
                    {summary.readableSummary}
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide">
                      Redactado por Asistente IA · Verificado con datos reales
                    </p>
                  </div>
                )}

                {/* Tarjetas Principales del Caso */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-border p-3 min-w-0">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                      Problema
                    </p>
                    <p className="font-semibold mt-1 break-words">{summary.problem}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 min-w-0">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                      Área responsable
                    </p>
                    <p className="font-semibold mt-1 break-words">
                      {departmentDisplayName(summary.department, departments)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3 min-w-0">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                      Estado
                    </p>
                    <p className="font-semibold mt-1">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary/10 text-primary">
                        {caseStatusLabel(summary.status as CaseStatus)}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3 min-w-0 sm:col-span-2 bg-muted/20">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="size-3 text-amber-500" /> Razón / Motivo
                    </p>
                    <p className="font-medium mt-1 text-[13px] text-foreground break-words leading-relaxed">
                      {humanizedReason}
                    </p>
                  </div>
                </div>

                {/* Pasos Completados */}
                {summary.completedSteps.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ListChecks className="size-3.5" /> Pasos completados
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {summary.completedSteps.map((step) => (
                        <div
                          key={step}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border text-xs"
                        >
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                          <span className="font-medium">{caseStepLabel(step)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cliente y Contrato */}
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

                {/* Diagnóstico y Estado */}
                {(diagnosticResult ||
                  instruction ||
                  (findings && findings.length > 0) ||
                  hasDebt !== undefined ||
                  debtAmount != null) && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles className="size-3.5" /> Diagnóstico y Estado
                    </h4>
                    <div className="rounded-lg border border-border divide-y divide-border text-xs">
                      {diagnosticResult && (
                        <div className="flex justify-between gap-3 px-3 py-2 items-center">
                          <span className="text-muted-foreground">Estado del diagnóstico</span>
                          <span className="text-right font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                            {diagnosticResult}
                          </span>
                        </div>
                      )}

                      {findings && findings.length > 0 && (
                        <div className="px-3 py-2 space-y-1.5">
                          <span className="text-muted-foreground font-medium">
                            Hallazgos técnicos:
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {findings.map((f, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold flex items-center gap-1"
                              >
                                <AlertTriangle className="size-3 shrink-0" />
                                {findingTypeLabel(f.type || f.description)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {instruction && (
                        <div className="p-3 bg-blue-500/5 border-l-2 border-primary space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                            <HelpCircle className="size-3" /> Instrucción solicitada al cliente
                          </p>
                          <p className="text-xs text-foreground leading-relaxed italic">
                            "{instruction}"
                          </p>
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

                {/* Telemetría del Equipo (ONU) - SIEMPRE VISIBLE EN CASOS DE SOPORTE */}
                {(isSupportCase || technical || rawTech || brand || onuModel || onuSerial) && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Wrench className="size-3.5" /> Telemetría del Equipo (ONU)
                      </span>
                      {isDiagnosticFailed && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase flex items-center gap-1">
                          <AlertTriangle className="size-3" /> Diagnóstico incompleto / fallido
                        </span>
                      )}
                    </h4>
                    <div className="rounded-lg border border-border divide-y divide-border text-xs">
                      <div className="flex justify-between gap-3 px-3 py-1.5">
                        <span className="text-muted-foreground">Marca</span>
                        <span className="text-right font-medium uppercase">
                          {brand || "No obtenida (null)"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 px-3 py-1.5">
                        <span className="text-muted-foreground">Estado de fase / ONU</span>
                        <span className="text-right font-semibold">
                          {phaseState ||
                            (runState
                              ? onuRunStateLabel(runState)
                              : isDiagnosticFailed
                                ? "No obtenido (falló diagnóstico)"
                                : "No obtenida (null)")}
                        </span>
                      </div>
                      {adminState && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Estado administrativo</span>
                          <span className="text-right font-medium">{adminState}</span>
                        </div>
                      )}
                      {onuIndex && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Índice ONU</span>
                          <span className="text-right font-medium font-mono">{onuIndex}</span>
                        </div>
                      )}
                      {omccState && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">OMCC</span>
                          <span className="text-right font-medium">{omccState}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-3 px-3 py-1.5">
                        <span className="text-muted-foreground">Canal GPON</span>
                        <span className="text-right font-medium">
                          {channel ||
                            (contract?.pon ? `PON ${contract.pon}` : "No obtenida (null)")}
                        </span>
                      </div>

                      {/* Potencia óptica: SIEMPRE VISIBLE */}
                      <div className="flex justify-between gap-3 px-3 py-1.5 items-center">
                        <span className="text-muted-foreground">Potencia óptica</span>
                        <span className="text-right font-medium flex items-center gap-1.5 justify-end">
                          {powerFormatted.isMeasured ? (
                            <>
                              <span className="font-semibold font-mono">{powerFormatted.text}</span>
                              {quality && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${quality.cls}`}
                                >
                                  {quality.label}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {powerFormatted.text}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 px-3 py-1.5">
                        <span className="text-muted-foreground">Modelo de ONU</span>
                        <span className="text-right font-medium">
                          {onuModel && onuModel !== "unknown" ? onuModel : "Desconocido (null)"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 px-3 py-1.5">
                        <span className="text-muted-foreground">Serial ONU</span>
                        <span className="text-right font-medium font-mono">
                          {onuSerial || contract?.serial || "No encontrada (null)"}
                        </span>
                      </div>

                      {/* MAC: SIEMPRE VISIBLE */}
                      <div className="flex justify-between gap-3 px-3 py-1.5 items-center">
                        <span className="text-muted-foreground">MAC</span>
                        <span className="text-right font-medium">
                          {macFormatted.isFound ? (
                            <span className="font-mono font-semibold">{macFormatted.text}</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {macFormatted.text}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Trazabilidad de Comandos OLT / MikroTik (_history) */}
                    {historySteps.length > 0 && (
                      <details className="w-full group mt-2">
                        <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border">
                          <span className="flex items-center gap-1.5">
                            <Terminal className="size-3.5 text-primary" />
                            Trazabilidad de comandos OLT ({historySteps.length} pasos)
                          </span>
                          <span className="text-[10px] text-muted-foreground/70">
                            (clic para ver detalle)
                          </span>
                        </summary>
                        <div className="mt-2 space-y-2 p-2 bg-muted/20 border border-border rounded-lg text-xs">
                          {historySteps.map((step, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-background border border-border rounded-md space-y-1"
                            >
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-foreground font-mono">
                                  #{idx + 1} {step.step || "comando"}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                    step.success !== false
                                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                      : "bg-red-500/10 text-red-600 border border-red-500/20"
                                  }`}
                                >
                                  {step.success !== false ? "Completado" : "Falló"}
                                </span>
                              </div>
                              {step.command && (
                                <p className="font-mono text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                                  $ {step.command}
                                </p>
                              )}
                              {step.raw && (
                                <details className="mt-1">
                                  <summary className="cursor-pointer text-[9px] text-muted-foreground hover:text-foreground font-medium">
                                    Ver salida consola (raw)
                                  </summary>
                                  <pre className="mt-1 p-2 bg-black/90 text-emerald-400 rounded text-[9px] font-mono whitespace-pre-wrap overflow-x-auto max-h-36">
                                    {step.raw}
                                  </pre>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {/* Otros Resultados (Contratos limpios, consola colapsable, sin JSON crudo) */}
                {otherResults.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <FileCode2 className="size-3.5" /> Información Adicional y de Red
                    </h4>
                    <div className="rounded-lg border border-border divide-y divide-border text-xs p-1">
                      {otherResults.map(([key, value]) => {
                        const isContracts = key === "contracts";
                        const isRaw = key === "rawOutput" || key.toLowerCase().includes("output");
                        return (
                          <div
                            key={key}
                            className={`p-2.5 ${
                              isContracts || isRaw
                                ? "flex flex-col gap-1.5"
                                : "flex justify-between gap-3 items-center"
                            }`}
                          >
                            <span className="text-muted-foreground font-semibold">
                              {humanizeResultKey(key)}:
                            </span>
                            <div
                              className={
                                isContracts || isRaw
                                  ? "w-full"
                                  : "text-right break-words font-medium"
                              }
                            >
                              {renderValueFriendly(key, value)}
                            </div>
                          </div>
                        );
                      })}
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
                        <li
                          key={i}
                          className="flex justify-between gap-2 p-1.5 rounded bg-muted/20"
                        >
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
                    className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-xs font-bold uppercase disabled:opacity-40 shadow-sm hover:brightness-95 transition"
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
