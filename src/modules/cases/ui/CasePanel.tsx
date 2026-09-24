import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Lock,
  Phone,
  Power,
  PowerOff,
  Send,
  Sparkles,
  UserCircle2,
  UserRound,
  Wrench,
  XCircle,
} from "lucide-react";
import type {
  CaseDto,
  PendingContractItem,
  SupportInternetDiagnosticTechnical,
} from "@/modules/cases/domain/case";
import {
  CANCELLABLE_STATUSES,
  caseStatusLabel,
  clientNameFromCase,
  findingTypeLabel,
  formatMacAddress,
  formatOpticalPower,
  onuRunStateLabel,
  onuSignalQuality,
  paymentStatusLabel,
  workflowLabel,
} from "@/modules/cases/domain/case";
import { advanceCase, type CloseReason } from "@/modules/cases/infrastructure/case.gateway";
import type { DepartmentDto } from "@/modules/identity/domain/department";
import { CompleteCaseModal } from "@/modules/cases/ui/CompleteCaseModal";
import { ScheduleCaseModal } from "@/modules/cases/ui/ScheduleCaseModal";

function DataRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{String(value)}</span>
    </div>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: typeof Wrench; children: string }) {
  return (
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 pt-1">
      <Icon className="size-3" />
      {children}
    </h4>
  );
}

/** Panel de contexto de caso con extracción unificada y robusta de datos técnicos, comerciales y financieros. */
function CaseContextBody({ caseDto }: { caseDto: CaseDto }) {
  const data = (caseDto.context?.data ?? {}) as Record<string, unknown>;
  const rawContext = caseDto.context as unknown as Record<string, unknown> | undefined;

  // 1. Contrato y Red
  const contract = (data.contract ?? rawContext?.contract) as
    { sector?: string; oltName?: string; pon?: string | number; serial?: string } | undefined;

  // 2. Deuda y Estado Financiero
  const balance = (data.balance ?? rawContext?.balance) as
    { hasDebt?: boolean; amount?: number } | undefined;
  const hasDebt = balance?.hasDebt ?? (data.hasDebt as boolean | undefined);
  const debtAmount =
    balance?.amount ?? (data.debt as number | undefined) ?? (data.amount as number | undefined);

  // 3. Diagnóstico Técnico
  const diagnostic = (data.diagnostic ?? rawContext?.diagnostic) as
    | {
        status?: string;
        result?: string;
        findings?: Array<{ type?: string; severity?: string; description?: string }>;
        instruction?: string;
        technical?: SupportInternetDiagnosticTechnical;
      }
    | string
    | undefined;
  const diagnosticResult =
    typeof diagnostic === "string" ? diagnostic : (diagnostic?.result ?? diagnostic?.status);
  const findings = typeof diagnostic === "object" ? diagnostic?.findings : undefined;
  const instruction =
    typeof diagnostic === "object"
      ? diagnostic?.instruction
      : (data.instruction as string | undefined);

  // 4. Pago y Comprobantes
  const payment = (data.payment ?? rawContext?.payment) as
    { amount?: number; reference?: string; status?: string } | undefined;

  // 5. Planes y Ofertas (Ventas / Comercial)
  const requestedSpeed = data.requestedSpeed as string | undefined;
  const currentPlan = data.currentPlan as { name?: string; speed?: string } | undefined;
  const offer = data.offer as
    { name?: string; price?: number | string; speed?: string } | undefined;

  // 6. Telemetría de la ONU (Normalizada o Cruda)
  const rawTech = (data.technical ??
    (typeof diagnostic === "object" ? diagnostic?.technical : undefined)) as
    Record<string, unknown> | undefined;
  const technical = rawTech as SupportInternetDiagnosticTechnical | undefined;

  const brand = technical?.brand || (rawTech?.brand as string | undefined);
  const onuModel =
    technical?.onuModel ||
    ((rawTech?.onu as Record<string, unknown> | undefined)?.model as string | undefined);
  const onuSerial =
    technical?.onuSerial ||
    ((rawTech?.onu as Record<string, unknown> | undefined)?.authinfo as string | undefined) ||
    ((rawTech?.onu as Record<string, unknown> | undefined)?.serial as string | undefined) ||
    contract?.serial;
  const onuIndex =
    technical?.onuIndex ||
    ((rawTech?.onu as Record<string, unknown> | undefined)?.onuindex as string | undefined) ||
    technical?.stateOnuIndex ||
    ((rawTech?.state as Record<string, unknown> | undefined)?.onuIndex as string | undefined);
  const phaseState =
    technical?.phaseState ||
    ((rawTech?.state as Record<string, unknown> | undefined)?.phaseState as string | undefined);
  const runState =
    technical?.runState ||
    ((rawTech?.state as Record<string, unknown> | undefined)?.runState as string | undefined);
  const adminState =
    technical?.adminState ||
    ((rawTech?.state as Record<string, unknown> | undefined)?.adminState as string | undefined);
  const channel =
    technical?.channel ||
    ((rawTech?.state as Record<string, unknown> | undefined)?.channel as string | undefined);

  const isSupportCase =
    caseDto.workflowType === "SUPPORT_INTERNET" || Boolean(contract?.serial || contract?.oltName);

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

  const hasAnyData = Boolean(
    isSupportCase ||
    contract?.sector ||
    contract?.oltName ||
    contract?.serial ||
    hasDebt !== undefined ||
    debtAmount != null ||
    diagnosticResult ||
    payment?.reference ||
    payment?.status ||
    requestedSpeed ||
    currentPlan?.name ||
    offer?.name ||
    technical ||
    rawTech,
  );

  if (!hasAnyData) {
    return (
      <p className="text-xs text-muted-foreground italic py-1">Sin datos técnicos adicionales.</p>
    );
  }

  return (
    <div className="space-y-1.5 text-[11px] font-mono">
      {/* Contrato / Sector */}
      {contract?.sector && <DataRow label="Sector" value={contract.sector} />}
      {contract?.oltName && <DataRow label="OLT" value={contract.oltName} />}
      {contract?.pon !== undefined && <DataRow label="PON" value={String(contract.pon)} />}
      {contract?.serial && <DataRow label="Serial" value={contract.serial} />}

      {/* Deuda / Saldo */}
      {(hasDebt !== undefined || debtAmount != null) && (
        <DataRow label="Deuda" value={hasDebt ? `Sí ($${debtAmount ?? 0})` : "No"} />
      )}

      {/* Diagnóstico técnico */}
      {diagnosticResult && <DataRow label="Diagnóstico" value={diagnosticResult} />}
      {findings && findings.length > 0 && (
        <div className="pt-1">
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">
            Hallazgos:
          </span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {findings.map((f, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded text-[9px] font-semibold"
              >
                {findingTypeLabel(f.type || f.description)}
              </span>
            ))}
          </div>
        </div>
      )}
      {instruction && (
        <div className="p-2 bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-primary rounded-r text-[10px] italic text-muted-foreground my-1 leading-snug">
          "{instruction}"
        </div>
      )}

      {/* Comercial / Planes (para Ventas) */}
      {requestedSpeed && <DataRow label="Velocidad solicitada" value={requestedSpeed} />}
      {currentPlan?.name && <DataRow label="Plan actual" value={currentPlan.name} />}
      {offer?.name && <DataRow label="Oferta" value={offer.name} />}
      {offer?.price != null && (
        <DataRow
          label="Precio oferta"
          value={typeof offer.price === "number" ? `$${offer.price}` : String(offer.price)}
        />
      )}

      {/* Pagos / Comprobantes */}
      {payment?.reference && <DataRow label="Referencia de pago" value={payment.reference} />}
      {payment?.status && (
        <DataRow label="Estado pago" value={paymentStatusLabel(payment.status)} />
      )}

      {/* Telemetría técnica ONU - Power y MAC SIEMPRE VISIBLES */}
      {(isSupportCase || technical || rawTech || brand || onuModel || onuSerial) && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-2">
            Lectura real del equipo (ONU)
          </p>
          <DataRow label="Marca" value={brand ? brand.toUpperCase() : "No obtenida (null)"} />
          <div className="flex justify-between gap-2 items-center">
            <span className="text-muted-foreground">Estado del equipo</span>
            <span className="text-right font-semibold">
              {phaseState ||
                (runState ? onuRunStateLabel(runState) : "No obtenido (falló diagnóstico)")}
            </span>
          </div>
          {adminState && <DataRow label="Estado admin" value={adminState} />}
          {onuIndex && <DataRow label="Índice ONU" value={onuIndex} />}
          {channel && <DataRow label="Canal GPON" value={channel} />}

          {/* Potencia óptica: SIEMPRE VISIBLE */}
          <div className="flex justify-between gap-2 items-center">
            <span className="text-muted-foreground">Potencia óptica</span>
            <span className="text-right font-medium flex items-center gap-1.5 justify-end">
              {powerFormatted.isMeasured ? (
                <>
                  <span className="font-semibold">{powerFormatted.text}</span>
                  {quality && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${quality.cls}`}
                    >
                      {quality.label}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  {powerFormatted.text}
                </span>
              )}
            </span>
          </div>

          <DataRow
            label="Modelo de ONU"
            value={onuModel && onuModel !== "unknown" ? onuModel : "Desconocido (null)"}
          />
          <DataRow
            label="Serial ONU"
            value={onuSerial || contract?.serial || "No encontrada (null)"}
          />

          {/* MAC: SIEMPRE VISIBLE */}
          <div className="flex justify-between gap-2 items-center">
            <span className="text-muted-foreground">MAC</span>
            <span className="text-right font-medium">
              {macFormatted.isFound ? (
                <span className="font-semibold">{macFormatted.text}</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  {macFormatted.text}
                </span>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function CasePanel({
  caseDto,
  customerName,
  customerPhone,
  busy,
  canWrite,
  canManage: canManageProp,
  departments,
  assignedAgentName,
  onOpenSummary,
  onComplete,
  onSchedule,
  onCancel,
  onTransfer,
  onDisableAutomation,
  onReactivateAutomation,
  onAdvance,
}: {
  caseDto: CaseDto | null;
  /** Nombre a mostrar del cliente (perfil de WhatsApp o teléfono formateado). */
  customerName?: string;
  customerPhone?: string;
  busy: boolean;
  canWrite: boolean;
  canManage?: boolean;
  departments: DepartmentDto[];
  /** Nombre del agente asignado ya resuelto — nunca se muestra el UUID crudo. */
  assignedAgentName?: string | null;
  onOpenSummary: () => void;
  onComplete: (closeReason?: CloseReason, note?: string) => void | Promise<unknown>;
  onSchedule?: (scheduledAt: string, reminderReason?: string) => void | Promise<unknown>;
  onCancel: (reason: string) => void;
  onTransfer: (toDepartmentId: string, reason: string) => void;
  onDisableAutomation: (reason: string) => void;
  onReactivateAutomation: () => void;
  onAdvance?: (entities: {
    selectedOption: number;
    contractCode?: string;
  }) => Promise<unknown> | void;
  onAdvance?: (entities: Record<string, unknown>) => Promise<unknown> | void;
}) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferDept, setTransferDept] = useState("");
  const [transferReason, setTransferReason] = useState("Requiere atención del área destino");
  const [assigningOption, setAssigningOption] = useState<number | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [diagnosticAnswer, setDiagnosticAnswer] = useState("");
  const [continuingDiagnostic, setContinuingDiagnostic] = useState(false);

  const canManage = canManageProp ?? canWrite;
  const currentState = caseDto
    ? (caseDto.workflowInstance?.currentState ?? caseDto.currentState)
    : undefined;
  const contextData = (caseDto?.context?.data ?? {}) as Record<string, unknown>;
  const rawContext = caseDto?.context as unknown as Record<string, unknown> | undefined;
  const pendingContracts = (contextData.pendingContracts ?? rawContext?.pendingContracts) as
    PendingContractItem[] | undefined;

  const handleManualAssign = async (option: number, contract: PendingContractItem) => {
    if (!caseDto) return;
    setAssigningOption(option);
    try {
      if (onAdvance) {
        await onAdvance({
          selectedOption: option,
          contractCode: contract.contractCode,
        });
      } else {
        await advanceCase(caseDto.id, {
          entities: {
            selectedOption: option,
            contractCode: contract.contractCode,
          },
        });
      }
    } finally {
      setAssigningOption(null);
    }
  };

  const handleContinueDiagnostic = async () => {
    if (!caseDto || !diagnosticAnswer.trim()) return;
    setContinuingDiagnostic(true);
    try {
      if (onAdvance) {
        await onAdvance({
          answer: diagnosticAnswer.trim(),
        });
      } else {
        await advanceCase(caseDto.id, {
          entities: {
            answer: diagnosticAnswer.trim(),
          },
        });
      }
      setDiagnosticAnswer("");
    } finally {
      setContinuingDiagnostic(false);
    }
  };

  const validatedName = caseDto ? clientNameFromCase(caseDto) : null;

  const customerCard = (customerName || customerPhone) && (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <SectionLabel icon={UserRound}>Cliente</SectionLabel>
      <div className="space-y-1.5 text-[11px] font-mono">
        <DataRow label="Nombre de WhatsApp" value={customerName} />
        {customerPhone && (
          <div className="flex justify-between gap-2 items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Phone className="size-3" /> Teléfono
            </span>
            <span className="text-right font-semibold">{customerPhone}</span>
          </div>
        )}
        {validatedName && validatedName !== customerName && (
          <DataRow label="Nombre validado (cédula)" value={validatedName} />
        )}
      </div>
    </div>
  );

  if (!caseDto) {
    return (
      <div className="space-y-4">
        {customerCard}
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <UserCircle2 className="size-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-xs font-semibold">Aún no hay un caso para esta conversación</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Este panel se abre solo en cuanto el asistente identifica en qué necesita ayuda el
            cliente — no hace falta hacer nada.
          </p>
        </div>
      </div>
    );
  }

  const tag = workflowLabel(caseDto.workflowType);

  const isAiAttending = (caseDto.automation?.enabled ?? true) && caseDto.status !== "HUMAN_ACTIVE";
  const handlerLabel = isAiAttending
    ? assignedAgentName
      ? `Asistente IA (Asignado a ${assignedAgentName})`
      : "Asistente IA"
    : (assignedAgentName ?? "Sin asignar todavía");

  return (
    <div className="space-y-4">
      {customerCard}

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-widest">Caso</h3>
          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${tag.cls}`}>
            {tag.label}
          </span>
        </div>

        {currentState === "WAITING_USER_DISAMBIGUATE" &&
          pendingContracts &&
          pendingContracts.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="font-semibold text-amber-900 text-xs mb-2">
                Selección de servicio pendiente ({pendingContracts.length} contratos)
              </p>
              {pendingContracts.map((c, i) => (
                <div
                  key={c.id || c.contractCode || i}
                  className="p-2 bg-white rounded border mb-1.5 text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold">
                      {i + 1}. {c.label || c.address}
                    </span>
                    <p className="text-gray-500">
                      Código: {c.contractCode || c.id} | {c.sector}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      disabled={busy || assigningOption === i + 1}
                      onClick={() => handleManualAssign(i + 1, c)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      {assigningOption === i + 1 ? "Asignando..." : "Asignar"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

        {currentState === "WAITING_USER_DIAGNOSTIC" && (
          <div className="p-3 bg-blue-50/80 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/60 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 dark:text-blue-200 text-xs flex items-center gap-1.5">
                <Activity className="size-3.5 text-blue-600" />
                Continuación de Diagnóstico Técnico
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-600 text-white">
                Esperando cliente
              </span>
            </div>

            {(() => {
              const diag = (contextData.diagnostic ?? rawContext?.diagnostic) as
                { instruction?: string; lastQuestion?: string } | undefined;
              const q =
                diag?.instruction ||
                diag?.lastQuestion ||
                (contextData.instruction as string | undefined);
              return q ? (
                <div className="text-[11px] text-blue-950 dark:text-blue-200 bg-white/70 dark:bg-background/40 p-2.5 rounded border border-blue-100 dark:border-blue-900/30 italic leading-relaxed">
                  "{q}"
                </div>
              ) : null;
            })()}

            {canManage && (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={diagnosticAnswer}
                  onChange={(e) => setDiagnosticAnswer(e.target.value)}
                  placeholder="Respuesta cliente (ej: Luz roja LOS / Todas verdes)"
                  className="w-full text-xs px-2.5 py-1.5 border border-border rounded-md bg-background text-foreground"
                  disabled={busy || continuingDiagnostic}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleContinueDiagnostic();
                    }
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {["Luz roja LOS", "Luces apagadas", "Todas verdes"].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={busy || continuingDiagnostic}
                      onClick={() => setDiagnosticAnswer(suggestion)}
                      className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] text-muted-foreground transition font-medium"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={busy || continuingDiagnostic || !diagnosticAnswer.trim()}
                  onClick={handleContinueDiagnostic}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold uppercase transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Send className="size-3" />
                  {continuingDiagnostic ? "Actualizando diagnóstico..." : "Continuar Diagnóstico"}
                </button>
              </div>
            )}
          </div>
        )}

        <SectionLabel icon={Sparkles}>Resumen</SectionLabel>
        {isAiAttending && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Bot className="size-4 text-emerald-500 shrink-0 animate-pulse" />
            <div>
              <p className="font-extrabold text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Atendido por Asistente IA
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300 leading-tight mt-0.5">
                Las respuestas de este caso están siendo generadas automáticamente por la IA.
              </p>
            </div>
          </div>
        )}
        <div className="space-y-1.5 text-[11px] font-mono">
          {!customerCard && <DataRow label="Cliente" value={validatedName} />}
          <DataRow label="Estado del caso" value={caseStatusLabel(caseDto.status)} />
          <DataRow
            label="Respuestas automáticas"
            value={
              caseDto.automation
                ? caseDto.automation.enabled
                  ? "Activas (responde el asistente)"
                  : "En pausa (responde un agente)"
                : "—"
            }
          />
          <DataRow label="Atendido por" value={handlerLabel} />
        </div>

        <SectionLabel icon={Wrench}>Datos técnicos</SectionLabel>
        <CaseContextBody caseDto={caseDto} />

        <button
          type="button"
          onClick={onOpenSummary}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-border text-[11px] font-bold uppercase tracking-wide hover:bg-foreground/5 transition"
        >
          <FileText className="size-3.5" />
          Ver detalles del caso
        </button>
      </div>

      {!canWrite && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-2.5">
          <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground">
            Este caso está asignado a otro agente. Puedes ver toda la información, pero solo esa
            persona (o un jefe de área) puede tomar acciones aquí.
          </p>
        </div>
      )}

      {canWrite && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-widest mb-1">Acciones</h3>

          {caseDto.automation?.enabled ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDisableAutomation("Agente toma control manual")}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-border text-[11px] font-bold uppercase tracking-wide hover:bg-foreground/5 transition disabled:opacity-40"
              title="El asistente deja de responder; a partir de ahora respondes tú"
            >
              <PowerOff className="size-3.5" /> Responder yo mismo
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onReactivateAutomation}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-border text-[11px] font-bold uppercase tracking-wide hover:bg-foreground/5 transition disabled:opacity-40"
              title="El asistente vuelve a responder automáticamente, sin perder lo ya conversado"
            >
              <Power className="size-3.5" /> Devolver al asistente
            </button>
          )}

          {onSchedule && (
            <button
              type="button"
              disabled={busy || caseDto.status === "COMPLETED"}
              onClick={() => setScheduleModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wide hover:bg-amber-500/20 transition disabled:opacity-40"
            >
              <Clock className="size-3.5" /> Agendar Seguimiento / En Espera
            </button>
          )}

          <button
            type="button"
            disabled={busy || caseDto.status === "COMPLETED"}
            onClick={() => setCompleteModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wide shadow-sm hover:brightness-95 transition disabled:opacity-40"
          >
            <CheckCircle2 className="size-3.5" /> Cerrar / Completar Caso
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => setTransferOpen((v) => !v)}
            className="w-full py-2.5 rounded-lg border border-border text-[11px] font-bold uppercase tracking-wide hover:bg-foreground/5 transition"
          >
            Enviar a otra área
          </button>

          {transferOpen && (
            <div className="space-y-2 pt-1">
              <select
                value={transferDept}
                onChange={(e) => setTransferDept(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-border rounded-lg bg-background"
              >
                <option value="">Selecciona departamento</option>
                {departments
                  .filter((d) => d.id !== caseDto.departmentId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
              <input
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-border rounded-lg bg-background"
                placeholder="Motivo (lo verá el área que lo recibe)"
              />
              <button
                type="button"
                disabled={busy || !transferDept}
                onClick={() => {
                  onTransfer(transferDept, transferReason);
                  setTransferOpen(false);
                }}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide disabled:opacity-40"
              >
                Confirmar envío
              </button>
            </div>
          )}

          {CANCELLABLE_STATUSES.includes(caseDto.status) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onCancel("Cancelado manualmente por el agente")}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-danger/30 text-danger text-[11px] font-bold uppercase tracking-wide hover:bg-danger/5 transition disabled:opacity-40"
            >
              <XCircle className="size-3.5" /> Cancelar caso
            </button>
          )}

          <CompleteCaseModal
            open={completeModalOpen}
            onOpenChange={setCompleteModalOpen}
            onConfirm={(reason, note) => Promise.resolve(onComplete(reason, note))}
            busy={busy}
          />

          {onSchedule && (
            <ScheduleCaseModal
              open={scheduleModalOpen}
              onOpenChange={setScheduleModalOpen}
              onConfirm={(at, reason) => Promise.resolve(onSchedule(at, reason))}
              busy={busy}
            />
          )}
        </div>
      )}
    </div>
  );
}

export { CasePanel as CaseDetailsSidebar };
