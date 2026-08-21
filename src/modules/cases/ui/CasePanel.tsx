import { useState } from "react";
import {
  FileText,
  Lock,
  Phone,
  Power,
  PowerOff,
  Sparkles,
  UserCircle2,
  UserRound,
  Wrench,
  XCircle,
} from "lucide-react";
import type { CaseDto, SupportInternetDiagnosticTechnical } from "@/modules/cases/domain/case";
import {
  CANCELLABLE_STATUSES,
  caseStatusLabel,
  clientNameFromCase,
  onuRunStateLabel,
  onuSignalQuality,
  paymentStatusLabel,
  workflowLabel,
} from "@/modules/cases/domain/case";
import type { DepartmentDto } from "@/modules/identity/domain/department";

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
    | { sector?: string; oltName?: string; pon?: string | number; serial?: string }
    | undefined;

  // 2. Deuda y Estado Financiero
  const balance = (data.balance ?? rawContext?.balance) as
    | { hasDebt?: boolean; amount?: number }
    | undefined;
  const hasDebt = balance?.hasDebt ?? (data.hasDebt as boolean | undefined);
  const debtAmount = balance?.amount ?? (data.debt as number | undefined) ?? (data.amount as number | undefined);

  // 3. Diagnóstico Técnico
  const diagnostic = (data.diagnostic ?? rawContext?.diagnostic) as
    | { status?: string; result?: string; technical?: SupportInternetDiagnosticTechnical }
    | string
    | undefined;
  const diagnosticResult = typeof diagnostic === "string" ? diagnostic : (diagnostic?.result ?? diagnostic?.status);

  // 4. Pago y Comprobantes
  const payment = (data.payment ?? rawContext?.payment) as
    | { amount?: number; reference?: string; status?: string }
    | undefined;

  // 5. Planes y Ofertas (Ventas / Comercial)
  const requestedSpeed = data.requestedSpeed as string | undefined;
  const currentPlan = data.currentPlan as { name?: string; speed?: string } | undefined;
  const offer = data.offer as { name?: string; price?: number | string; speed?: string } | undefined;

  // 6. Telemetría de la ONU
  const technical = (data.technical ?? (typeof diagnostic === "object" ? diagnostic?.technical : undefined)) as
    | SupportInternetDiagnosticTechnical
    | undefined;
  const quality = technical ? onuSignalQuality(technical.opticalPowerDbm) : null;

  const hasAnyData = Boolean(
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
      technical,
  );

  if (!hasAnyData) {
    return <p className="text-xs text-muted-foreground italic py-1">Sin datos técnicos adicionales.</p>;
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
        <DataRow
          label="Deuda"
          value={hasDebt ? `Sí ($${debtAmount ?? 0})` : "No"}
        />
      )}

      {/* Diagnóstico técnico */}
      {diagnosticResult && (
        <DataRow label="Diagnóstico" value={diagnosticResult} />
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
      {payment?.status && <DataRow label="Estado pago" value={paymentStatusLabel(payment.status)} />}

      {/* Telemetría técnica ONU */}
      {technical && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-2">
            Lectura real del equipo (ONU)
          </p>
          {technical.runState && (
            <div className="flex justify-between gap-2 items-center">
              <span className="text-muted-foreground">Estado del equipo</span>
              <span className="text-right font-semibold">{onuRunStateLabel(technical.runState)}</span>
            </div>
          )}
          {technical.opticalPowerDbm != null && (
            <div className="flex justify-between gap-2 items-center">
              <span className="text-muted-foreground">Potencia óptica</span>
              <span className="flex items-center gap-1.5">
                <span className="font-semibold">{technical.opticalPowerDbm.toFixed(1)} dBm</span>
                {quality && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${quality.cls}`}>
                    {quality.label}
                  </span>
                )}
              </span>
            </div>
          )}
          {technical.onuModel && technical.onuModel !== "unknown" && (
            <DataRow label="Modelo de ONU" value={technical.onuModel} />
          )}
          {technical.macAddress && <DataRow label="MAC" value={technical.macAddress} />}
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
  departments,
  assignedAgentName,
  onOpenSummary,
  onComplete,
  onCancel,
  onTransfer,
  onDisableAutomation,
  onReactivateAutomation,
}: {
  caseDto: CaseDto | null;
  /** Nombre a mostrar del cliente (perfil de WhatsApp o teléfono formateado). */
  customerName?: string;
  customerPhone?: string;
  busy: boolean;
  canWrite: boolean;
  departments: DepartmentDto[];
  /** Nombre del agente asignado ya resuelto — nunca se muestra el UUID crudo. */
  assignedAgentName?: string | null;
  onOpenSummary: () => void;
  onComplete: (note?: string) => void;
  onCancel: (reason: string) => void;
  onTransfer: (toDepartmentId: string, reason: string) => void;
  onDisableAutomation: (reason: string) => void;
  onReactivateAutomation: () => void;
}) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferDept, setTransferDept] = useState("");
  const [transferReason, setTransferReason] = useState("Requiere atención del área destino");

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
  const canManageEscalation = caseDto.status === "ESCALATED" || caseDto.status === "HUMAN_ACTIVE";

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

        <SectionLabel icon={Sparkles}>Resumen</SectionLabel>
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
          <DataRow label="Atendido por" value={assignedAgentName ?? "Sin asignar todavía"} />
        </div>

        <SectionLabel icon={Wrench}>Datos técnicos</SectionLabel>
        <CaseContextBody caseDto={caseDto} />

        {canManageEscalation && (
          <button
            type="button"
            onClick={onOpenSummary}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-border text-[11px] font-bold uppercase tracking-wide hover:bg-foreground/5 transition"
          >
            <FileText className="size-3.5" />
            Ver resumen del caso
          </button>
        )}
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

          <button
            type="button"
            disabled={busy || caseDto.status === "COMPLETED"}
            onClick={() => onComplete()}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wide shadow-sm hover:brightness-95 transition disabled:opacity-40"
          >
            Marcar como resuelto
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
        </div>
      )}
    </div>
  );
}
