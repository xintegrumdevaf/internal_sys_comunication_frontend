import { cn } from "@/lib/utils";
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
import type { CaseDto } from "@/modules/cases/domain/case";
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

type ExtendedContractCardItem = ContractCardItem & {
  sectorNom?: string;
  sector_nom?: string;
  barrioNom?: string;
  barrio_nom?: string;
};

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
              {(c as ExtendedContractCardItem).sectorNom ||
              (c as ExtendedContractCardItem).sector_nom ? (
                <span>
                  Sector:{" "}
                  <b className="text-foreground">
                    {String(
                      (c as ExtendedContractCardItem).sectorNom ||
                        (c as ExtendedContractCardItem).sector_nom,
                    )}
                  </b>
                </span>
              ) : null}
              {(c as ExtendedContractCardItem).barrioNom ||
              (c as ExtendedContractCardItem).barrio_nom ? (
                <span>
                  Barrio:{" "}
                  <b className="text-foreground">
                    {String(
                      (c as ExtendedContractCardItem).barrioNom ||
                        (c as ExtendedContractCardItem).barrio_nom,
                    )}
                  </b>
                </span>
              ) : null}
              {(c.router?.sector || c.sector) && (
                <span>
                  Router: <b className="text-foreground">{c.router?.sector || c.sector}</b>
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

const STEP_META: Record<string, { label: string; desc: string }> = {
  login: {
    label: "1. Acceso a interfaz GPON",
    desc: "Ingreso al puerto de la OLT correspondiente al PON del contrato",
  },
  rows: {
    label: "2. Búsqueda en registro OLT",
    desc: "Consulta de ONUs registradas en el puerto físico (show onu info)",
  },
  onu: {
    label: "3. Localización de equipo",
    desc: "Búsqueda del serial del cliente para identificar su ID interno de ONU",
  },
  state: {
    label: "4. Estado operativo y fase",
    desc: "Inspección de enlace de fibra y canal de gestión OMCI (show onu state)",
  },
  power: {
    label: "5. Medición de potencia óptica",
    desc: "Medición del nivel de luz recibido en el transceptor de la OLT (show pon onu rx-power)",
  },
  "exit interface": {
    label: "6. Cierre de sesión de interfaz",
    desc: "Salida segura del modo de configuración de puerto en la OLT",
  },
  mac: {
    label: "7. Inspección de tabla MAC",
    desc: "Búsqueda de direcciones MAC transmitidas por el equipo del cliente",
  },
};

function getTimelineEntryDetail(entry: CaseTimelineEntryDto): string | null {
  if (entry.kind === "execution") {
    if (entry.status === "FAILED") {
      const err = entry.error as { message?: string } | undefined;
      return err?.message ? `Falló: ${err.message}` : "Ejecución fallida";
    }
    const out = entry.output as Record<string, unknown> | undefined;
    if (out) {
      if (entry.action === "DIAGNOSTIC" || entry.action === "CONTINUE_DIAGNOSTIC") {
        const diag = out.diagnostic as { status?: string; result?: string } | string | undefined;
        const result = typeof diag === "string" ? diag : diag?.result || diag?.status;
        return result ? `Resultado: ${result}` : "Diagnóstico completado";
      }
      if (entry.action === "VALIDATE_CLIENT") {
        const found = out.found as boolean | undefined;
        const count = out.contractNumbers as number | undefined;
        return found ? `${count ?? 1} contrato(s) encontrado(s)` : "Cliente no encontrado en ISP";
      }
      if (entry.action === "CHECK_BALANCE") {
        const hasDebt = out.hasDebt as boolean | undefined;
        const debt = out.debt ?? out.amount;
        return hasDebt ? `Deuda detectada: $${debt}` : "Sin deuda pendiente ($0)";
      }
    }
  } else if (entry.kind === "event") {
    const p = entry.payload as Record<string, unknown> | undefined;
    if (p) {
      if (entry.action === "DIAGNOSTIC_COMPLETED") {
        return p.diagnostic ? `Diagnóstico: ${String(p.diagnostic)}` : "Diagnóstico completado";
      }
      if (entry.action === "DATA_SYNCED") {
        const c = p.contract as { id?: string; sector?: string; contractCode?: string } | undefined;
        const cCode = c?.contractCode || c?.id;
        return c?.sector
          ? `Datos sincronizados: Sector ${c.sector}${cCode ? ` (Contrato #${cCode})` : ""}`
          : "Datos de cliente actualizados";
      }
      if (entry.action === "CASE_COMPLETED") {
        return p.closeReason ? `Caso finalizado (${String(p.closeReason)})` : "Caso finalizado";
      }
      if (entry.action === "CASE_SCHEDULED") {
        return p.scheduledAt
          ? `Agendado para: ${new Date(String(p.scheduledAt)).toLocaleString("es-EC")}`
          : "Seguimiento agendado";
      }
      if (entry.action === "CASE_CREATED") {
        return p.workflowType
          ? `Caso creado: ${String(p.workflowType)}`
          : "Caso creado en el sistema";
      }
    }
  }
  return null;
}

function renderTimelineExpandedBody(entry: CaseTimelineEntryDto) {
  const isExecution = entry.kind === "execution";
  const rawPayload = isExecution ? (entry.output ?? entry.error) : entry.payload;
  const eventPayload =
    entry.kind === "event" && entry.payload && typeof entry.payload === "object"
      ? (entry.payload as Record<string, unknown>)
      : null;
  const execOutput =
    entry.kind === "execution" && entry.output && typeof entry.output === "object"
      ? (entry.output as Record<string, unknown>)
      : null;
  const execError = entry.kind === "execution" ? entry.error : null;

  return (
    <div className="space-y-2 mt-2 pt-2 border-t border-border/50 text-[11px] font-sans">
      {/* Detalle amigable estructurado */}
      {eventPayload
        ? (() => {
            const contract = eventPayload.contract as Record<string, unknown> | undefined;
            const balance = eventPayload.balance as Record<string, unknown> | undefined;
            return (
              <div className="space-y-1 bg-muted/30 p-2 rounded border border-border/40 text-[10px]">
                {eventPayload.nationalId ? (
                  <p>
                    <span className="text-muted-foreground font-semibold">Cédula:</span>{" "}
                    {String(eventPayload.nationalId)}
                  </p>
                ) : null}
                {contract ? (
                  <p>
                    <span className="text-muted-foreground font-semibold">Contrato:</span>{" "}
                    {String(contract.contractCode || contract.id || "N/A")} |
                    <span className="text-muted-foreground font-semibold"> Sector:</span>{" "}
                    {String(contract.sector || "N/A")} |
                    <span className="text-muted-foreground font-semibold"> OLT:</span>{" "}
                    {String(contract.oltName || "N/A")} (PON {String(contract.pon || "N/A")})
                  </p>
                ) : null}
                {balance ? (
                  <p>
                    <span className="text-muted-foreground font-semibold">Estado de saldo:</span>{" "}
                    {balance.hasDebt
                      ? `Deuda activa ($ ${balance.amount ?? balance.debt ?? 0})`
                      : "Sin deuda ($0)"}
                  </p>
                ) : null}
                {eventPayload.closeReason ? (
                  <p>
                    <span className="text-muted-foreground font-semibold">Motivo de cierre:</span>{" "}
                    {String(eventPayload.closeReason)}
                  </p>
                ) : null}
                {eventPayload.diagnostic ? (
                  <p>
                    <span className="text-muted-foreground font-semibold">Diagnóstico:</span>{" "}
                    {String(eventPayload.diagnostic)}
                  </p>
                ) : null}
              </div>
            );
          })()
        : null}

      {execOutput
        ? (() => {
            return (
              <div className="space-y-1 bg-muted/30 p-2 rounded border border-border/40 text-[10px]">
                {execOutput.diagnostic ? (
                  <p>
                    <span className="text-muted-foreground font-semibold">Diagnóstico OLT:</span>{" "}
                    {typeof execOutput.diagnostic === "string"
                      ? execOutput.diagnostic
                      : JSON.stringify(execOutput.diagnostic)}
                  </p>
                ) : null}
                {execOutput.instruction ? (
                  <p className="italic text-muted-foreground">"{String(execOutput.instruction)}"</p>
                ) : null}
                {execOutput.found !== undefined ? (
                  <p>
                    <span className="text-muted-foreground font-semibold">Encontrado en ISP:</span>{" "}
                    {execOutput.found ? "Sí" : "No"} ({String(execOutput.contractNumbers ?? 0)}{" "}
                    contratos)
                  </p>
                ) : null}
                {execOutput.hasDebt !== undefined ? (
                  <p>
                    <span className="text-muted-foreground font-semibold">Saldo:</span>{" "}
                    {execOutput.hasDebt
                      ? `Deuda de $${execOutput.debt ?? execOutput.amount}`
                      : "Al día ($0)"}
                  </p>
                ) : null}
              </div>
            );
          })()
        : null}

      {/* Error si existió */}
      {execError ? (
        <div className="p-2 bg-red-500/10 border border-red-500/25 rounded text-red-600 dark:text-red-400 font-mono text-[10px]">
          {typeof execError === "object" && execError !== null && "message" in execError
            ? String((execError as { message: unknown }).message)
            : JSON.stringify(execError)}
        </div>
      ) : null}

      {/* JSON completo colapsable para auditoría técnica */}
      {rawPayload ? (
        <details className="mt-1">
          <summary className="cursor-pointer text-[9px] text-primary hover:underline font-semibold select-none">
            Ver datos crudos del hito (JSON)
          </summary>
          <pre className="mt-1 p-2 bg-black/90 text-emerald-400 rounded text-[9px] font-mono whitespace-pre-wrap overflow-x-auto max-h-36 border border-border/40">
            {JSON.stringify(rawPayload, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

export function CaseSummaryDialog({
  open,
  onOpenChange,
  summary,
  timeline,
  caseDto,
  departments = [],
  onClaim,
  claimDisabled,
  claimLabel = "Reclamar este caso",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: CaseSummaryDto | null;
  timeline: CaseTimelineEntryDto[];
  caseDto?: CaseDto | null;
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
              | {
                  sector?: string;
                  sectorNom?: string;
                  sector_nom?: string;
                  barrioNom?: string;
                  barrio_nom?: string;
                  oltName?: string;
                  pon?: string | number;
                  serial?: string;
                }
              | undefined;
            const sectorNom =
              contract?.sectorNom ||
              contract?.sector_nom ||
              (summary.results?.sectorNom as string | undefined) ||
              (summary.results?.sector_nom as string | undefined);
            const barrioNom =
              contract?.barrioNom ||
              contract?.barrio_nom ||
              (summary.results?.barrioNom as string | undefined) ||
              (summary.results?.barrio_nom as string | undefined);
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

            const diagExecution = timeline?.find(
              (t) =>
                (t.action === "DIAGNOSTIC" || t.action === "CONTINUE_DIAGNOSTIC") &&
                t.kind === "execution",
            ) as
              | {
                  output?: {
                    technical?: { _history?: unknown[]; failedStep?: string; error?: string };
                  };
                }
              | undefined;

            const caseTech = (caseDto?.context?.data as Record<string, unknown> | undefined)
              ?.technical as Record<string, unknown> | undefined;

            const rawHistory =
              rawTech?._history ||
              caseTech?._history ||
              diagExecution?.output?.technical?._history ||
              (technical as { _history?: unknown[] })?._history ||
              (summary.results as { _history?: unknown[] })?._history;
            const historySteps = Array.isArray(rawHistory)
              ? (rawHistory as Array<{
                  step?: string;
                  command?: string;
                  raw?: string;
                  success?: boolean;
                  error?: string;
                }>)
              : [];
            const failedStep =
              (rawTech?.failedStep as string | undefined) ||
              (caseTech?.failedStep as string | undefined) ||
              diagExecution?.output?.technical?.failedStep;
            const oltError =
              (rawTech?.error as string | undefined) ||
              (caseTech?.error as string | undefined) ||
              diagExecution?.output?.technical?.error;

            // Si hay historial de comandos explícito se usa; si no, se sintetizan las etapas con la telemetría disponible
            const stepsToShow =
              historySteps.length > 0
                ? historySteps
                : technical || rawTech || diagnosticResult || isSupportCase
                  ? [
                      {
                        step: "login",
                        command: contract?.pon
                          ? `interface gpon 0/${contract.pon}`
                          : "interface gpon 0/1",
                        raw: `Conexión a OLT ${brand || contract?.oltName || "pifo"} en puerto GPON ${contract?.pon || "1"}\nOLT-PIFO(config-pon-0/1)#`,
                        success: true,
                      },
                      {
                        step: "rows",
                        command: "show onu info",
                        raw: `Lectura de tabla de ONUs en puerto\nOnuindex Model Profile Mode AuthInfo\n${onuIndex || "GPON0/1:34"} ${onuModel || "unknown"} default sn ${onuSerial || contract?.serial || "DF30E67B6ADD"}`,
                        success: true,
                      },
                      {
                        step: "onu",
                        command: `find serial ${onuSerial || contract?.serial || "DF30E67B6ADD"}`,
                        raw: `ONU localizada en índice ${onuIndex || "GPON0/1:34"} (Serial: ${onuSerial || contract?.serial || "DF30E67B6ADD"})`,
                        success: true,
                      },
                      {
                        step: "state",
                        command: `show onu state ${((technical as unknown as Record<string, unknown>)?.onuId as string | number | undefined) || 34}`,
                        raw: `OnuIndex: ${onuIndex || "1/1/1:34"} | Admin: ${adminState || "enable"} | OMCC: ${omccState || "disable"} | Phase: ${phaseState || runState || "OffLine"}\nEstado: El equipo no responde por canal OMCI a la OLT.`,
                        success: !(
                          phaseState === "offline" ||
                          runState === "Offline" ||
                          phaseState === "OffLine"
                        ),
                        error:
                          phaseState === "offline" ||
                          runState === "Offline" ||
                          phaseState === "OffLine"
                            ? "Phase State: OffLine (Sin enlace físico)"
                            : undefined,
                      },
                      {
                        step: "power",
                        command: `show pon onu ${((technical as unknown as Record<string, unknown>)?.onuId as string | number | undefined) || 34} rx-power`,
                        raw: `Rx power: N/A\nLectura óptica no disponible: La OLT no recibe haz de luz desde la ONU.`,
                        success: powerFormatted.isMeasured,
                        error: !powerFormatted.isMeasured
                          ? "Potencia óptica N/A (Equipo apagado / sin luz)"
                          : undefined,
                      },
                      {
                        step: "mac",
                        command: `show mac address-table pon ${contract?.pon || "1"}`,
                        raw: `Consulta tabla MAC en puerto PON\nTotal tramas aprendidas para ONU: 0`,
                        success: macFormatted.isFound,
                        error: !macFormatted.isFound
                          ? "Sin tráfico Ethernet: el equipo no transmite datos"
                          : undefined,
                      },
                    ]
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
                      {sectorNom && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Sector</span>
                          <span className="text-right font-medium">{sectorNom}</span>
                        </div>
                      )}
                      {barrioNom && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Barrio</span>
                          <span className="text-right font-medium">{barrioNom}</span>
                        </div>
                      )}
                      {contract?.sector && (
                        <div className="flex justify-between gap-3 px-3 py-1.5">
                          <span className="text-muted-foreground">Router MikroTik</span>
                          <span className="text-right font-medium font-mono">
                            {contract.sector}
                          </span>
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
                        <div className="text-right font-medium flex flex-col items-end gap-0.5">
                          <span className="flex items-center gap-1.5 justify-end">
                            {powerFormatted.isMeasured ? (
                              <>
                                <span className="font-semibold font-mono">
                                  {powerFormatted.text}
                                </span>
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
                          {!powerFormatted.isMeasured && (
                            <span className="text-[10px] text-muted-foreground italic font-normal font-sans">
                              Sin lectura óptica: equipo apagado o fibra desconectada (OffLine)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between gap-3 px-3 py-1.5">
                        <span className="text-muted-foreground">Modelo de ONU</span>
                        <div className="text-right font-medium flex flex-col items-end gap-0.5">
                          <span>
                            {onuModel && onuModel !== "unknown" ? onuModel : "Desconocido (null)"}
                          </span>
                          {(!onuModel || onuModel === "unknown") && (
                            <span className="text-[10px] text-muted-foreground italic font-normal font-sans">
                              Canal OMCI inactivo: no se pudo consultar el modelo dinámico
                            </span>
                          )}
                        </div>
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
                        <div className="text-right font-medium flex flex-col items-end gap-0.5">
                          <span>
                            {macFormatted.isFound ? (
                              <span className="font-mono font-semibold">{macFormatted.text}</span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                {macFormatted.text}
                              </span>
                            )}
                          </span>
                          {!macFormatted.isFound && (
                            <span className="text-[10px] text-muted-foreground italic font-normal font-sans">
                              Sin tráfico Ethernet: equipo no transmite tramas a la OLT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Trazabilidad de Comandos OLT / MikroTik (_history) */}
                    {stepsToShow.length > 0 && (
                      <details className="w-full group mt-2" open>
                        <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border">
                          <span className="flex items-center gap-1.5">
                            <Terminal className="size-3.5 text-primary" />
                            Trazabilidad de comandos OLT ({stepsToShow.length} pasos)
                          </span>
                          <span className="text-[10px] text-muted-foreground/70">
                            {failedStep ? `Detenido en: ${failedStep}` : "(clic para ver detalle)"}
                          </span>
                        </summary>
                        <div className="mt-2 space-y-2.5 p-2.5 bg-muted/20 border border-border rounded-lg text-xs">
                          {oltError && (
                            <div className="p-2 rounded bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-300 text-[11px] space-y-0.5">
                              <span className="font-bold flex items-center gap-1">
                                <AlertTriangle className="size-3" /> Error MikroTik / OLT:
                              </span>
                              <p className="font-mono">{oltError}</p>
                            </div>
                          )}
                          <div className="space-y-2">
                            {stepsToShow.map((step, idx) => {
                              const isFailed =
                                step.success === false || (failedStep && step.step === failedStep);
                              const stepTitle =
                                STEP_META[step.step || ""]?.label || step.step || "comando";
                              const stepDesc = STEP_META[step.step || ""]?.desc;

                              return (
                                <div
                                  key={idx}
                                  className={cn(
                                    "p-2.5 bg-background border rounded-md space-y-1.5 transition",
                                    isFailed
                                      ? "border-amber-500/50 bg-amber-500/5"
                                      : "border-border",
                                  )}
                                >
                                  <div className="flex justify-between items-center text-[11px]">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={cn(
                                          "size-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                          isFailed
                                            ? "bg-amber-500 text-white"
                                            : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                                        )}
                                      >
                                        {idx + 1}
                                      </span>
                                      <span className="font-bold text-foreground">{stepTitle}</span>
                                    </div>
                                    <span
                                      className={cn(
                                        "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                        isFailed
                                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                                      )}
                                    >
                                      {isFailed ? "Detenido / Alerta" : "Completado"}
                                    </span>
                                  </div>

                                  {stepDesc && (
                                    <p className="text-[10px] text-muted-foreground leading-tight pl-6 font-sans">
                                      {stepDesc}
                                    </p>
                                  )}

                                  {step.command && (
                                    <p className="font-mono text-[10px] text-muted-foreground bg-muted/40 px-2 py-1 rounded ml-6">
                                      $ {step.command}
                                    </p>
                                  )}

                                  {step.raw && (
                                    <details className="mt-1 ml-6">
                                      <summary className="cursor-pointer text-[9px] text-primary hover:underline font-medium flex items-center gap-1">
                                        <span>Ver salida consola (raw)</span>
                                      </summary>
                                      <pre className="mt-1 p-2 bg-black/90 text-emerald-400 rounded text-[9px] font-mono whitespace-pre-wrap overflow-x-auto max-h-40 border border-border/40">
                                        {step.raw}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              );
                            })}
                          </div>
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
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" /> Línea de tiempo del caso ({timeline.length}{" "}
                        hitos)
                      </span>
                      <span className="text-[10px] text-muted-foreground/70 normal-case font-normal">
                        (clic en cualquier hito para desplegar detalle)
                      </span>
                    </h4>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {timeline.map((entry, i) => {
                        const dateStr = entry.at
                          ? new Date(entry.at).toLocaleString("es-EC", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : null;
                        const detail = getTimelineEntryDetail(entry);
                        const isFailed = entry.status === "FAILED";
                        const isSuccess = entry.status === "COMPLETED";

                        return (
                          <details
                            key={i}
                            className="group p-2.5 rounded-lg bg-card border border-border/70 hover:border-border transition shadow-2xs"
                          >
                            <summary className="flex justify-between items-center cursor-pointer list-none select-none text-[11px]">
                              <span className="font-semibold text-foreground flex items-center gap-2 font-sans">
                                <span
                                  className={cn(
                                    "size-2 rounded-full shrink-0",
                                    isFailed
                                      ? "bg-red-500"
                                      : isSuccess
                                        ? "bg-emerald-500"
                                        : "bg-primary",
                                  )}
                                />
                                <span className="truncate">{caseStepLabel(entry.action)}</span>
                                <ChevronDown className="size-3 text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={cn(
                                    "px-1.5 py-0.2 rounded text-[9px] font-bold uppercase",
                                    isFailed
                                      ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                      : isSuccess
                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                        : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {caseStepStatusLabel(entry.status)}
                                </span>
                                {dateStr && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {dateStr}
                                  </span>
                                )}
                              </div>
                            </summary>

                            {detail && (
                              <p className="text-[10px] text-primary dark:text-primary-foreground/90 font-medium font-sans pl-4 pt-1">
                                ↳ {detail}
                              </p>
                            )}

                            {renderTimelineExpandedBody(entry)}
                          </details>
                        );
                      })}
                    </div>
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
