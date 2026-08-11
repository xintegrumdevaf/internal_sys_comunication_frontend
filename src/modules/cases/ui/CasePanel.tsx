import { useState } from "react";
import { FileText, Power, PowerOff, XCircle } from "lucide-react";
import type { CaseDto } from "@/modules/cases/domain/case";
import { caseStatusLabel, clientNameFromCase, workflowLabel } from "@/modules/cases/domain/case";
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

/** Panel de contexto de caso, renderizado por workflowType (01_DATA_MODEL.md §3). */
function CaseContextBody({ caseDto }: { caseDto: CaseDto }) {
  const data = caseDto.context?.data as Record<string, unknown> | undefined;
  if (!data) return <p className="text-muted-foreground">Sin contexto todavía.</p>;

  if (caseDto.context.workflowType === "SUPPORT_INTERNET") {
    const d = data as {
      contract?: { sector?: string; oltName?: string; pon?: string; serial?: string };
      balance?: { hasDebt?: boolean; amount?: number };
      diagnostic?: { status?: string; result?: string };
    };
    return (
      <div className="space-y-1.5 text-[11px] font-mono">
        <DataRow label="Sector" value={d.contract?.sector} />
        <DataRow label="OLT" value={d.contract?.oltName} />
        <DataRow label="PON" value={d.contract?.pon} />
        <DataRow label="Serial" value={d.contract?.serial} />
        <DataRow label="Deuda" value={d.balance?.hasDebt ? `Sí ($${d.balance?.amount ?? 0})` : "No"} />
        <DataRow label="Diagnóstico" value={d.diagnostic?.status} />
        <DataRow label="Resultado" value={d.diagnostic?.result} />
      </div>
    );
  }

  if (caseDto.context.workflowType === "BILLING_BALANCE") {
    const d = data as {
      balance?: { hasDebt?: boolean; amount?: number };
      payment?: { amount?: number; reference?: string; status?: string };
    };
    return (
      <div className="space-y-1.5 text-[11px] font-mono">
        <DataRow label="Deuda" value={d.balance?.hasDebt ? "Sí" : "No"} />
        <DataRow
          label="Monto"
          value={
            d.balance?.amount != null
              ? d.balance.amount.toLocaleString("es-CO", { style: "currency", currency: "COP" })
              : undefined
          }
        />
        <DataRow label="Referencia pago" value={d.payment?.reference} />
        <DataRow label="Estado pago" value={d.payment?.status} />
      </div>
    );
  }

  if (caseDto.context.workflowType === "SALES_PACKAGES") {
    const d = data as {
      requestedSpeed?: string;
      currentPlan?: { name?: string; speed?: string };
      offer?: { name?: string; price?: number; speed?: string };
    };
    return (
      <div className="space-y-1.5 text-[11px] font-mono">
        <DataRow label="Velocidad solicitada" value={d.requestedSpeed} />
        <DataRow label="Plan actual" value={d.currentPlan?.name} />
        <DataRow label="Oferta" value={d.offer?.name} />
        <DataRow
          label="Precio oferta"
          value={
            d.offer?.price != null
              ? d.offer.price.toLocaleString("es-CO", { style: "currency", currency: "COP" })
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <pre className="text-[10px] font-mono whitespace-pre-wrap break-all text-muted-foreground">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function CasePanel({
  caseDto,
  busy,
  canWrite,
  departments,
  onOpenSummary,
  onComplete,
  onCancel,
  onTransfer,
  onDisableAutomation,
  onReactivateAutomation,
}: {
  caseDto: CaseDto | null;
  busy: boolean;
  canWrite: boolean;
  departments: DepartmentDto[];
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

  if (!caseDto) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 text-[11px] text-muted-foreground">
        Sin caso vinculado a esta conversación (aún no requiere workflow).
      </div>
    );
  }

  const tag = workflowLabel(caseDto.workflowType);
  const canManageEscalation = caseDto.status === "ESCALATED" || caseDto.status === "HUMAN_ACTIVE";

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-widest">Caso</h3>
          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${tag.cls}`}>
            {tag.label}
          </span>
        </div>
        <div className="space-y-1.5 text-[11px] font-mono">
          <DataRow label="Cliente" value={clientNameFromCase(caseDto)} />
          <DataRow label="Estado" value={caseStatusLabel(caseDto.status)} />
          <DataRow
            label="Automatización"
            value={
              caseDto.automation
                ? caseDto.automation.enabled
                  ? "Activa"
                  : `Desactivada${caseDto.automation.disabledReason ? ` (${caseDto.automation.disabledReason})` : ""}`
                : "—"
            }
          />
          <DataRow label="Asignado a" value={caseDto.assignedAgentId ?? "Sin asignar"} />
        </div>

        <CaseContextBody caseDto={caseDto} />

        {canManageEscalation && (
          <button
            type="button"
            onClick={onOpenSummary}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-border text-[11px] font-bold uppercase hover:bg-foreground/5"
          >
            <FileText className="size-3.5" />
            Ver resumen del caso
          </button>
        )}
      </div>

      {canWrite && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-widest mb-1">Acciones</h3>

          {caseDto.automation?.enabled ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDisableAutomation("Agente toma control manual")}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-border text-[11px] font-bold uppercase hover:bg-foreground/5 disabled:opacity-40"
            >
              <PowerOff className="size-3.5" /> Desactivar automatización
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onReactivateAutomation}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-border text-[11px] font-bold uppercase hover:bg-foreground/5 disabled:opacity-40"
            >
              <Power className="size-3.5" /> Reactivar automatización
            </button>
          )}

          <button
            type="button"
            disabled={busy || caseDto.status === "COMPLETED"}
            onClick={() => onComplete()}
            className="w-full py-2 rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase disabled:opacity-40"
          >
            Completar caso
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => setTransferOpen((v) => !v)}
            className="w-full py-2 rounded-md border border-border text-[11px] font-bold uppercase hover:bg-foreground/5"
          >
            Transferir a otro depto.
          </button>

          {transferOpen && (
            <div className="space-y-2 pt-1">
              <select
                value={transferDept}
                onChange={(e) => setTransferDept(e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-border rounded bg-card"
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
                className="w-full text-xs px-2 py-1.5 border border-border rounded bg-card"
                placeholder="Motivo"
              />
              <button
                type="button"
                disabled={busy || !transferDept}
                onClick={() => {
                  onTransfer(transferDept, transferReason);
                  setTransferOpen(false);
                }}
                className="w-full py-1.5 rounded bg-foreground text-background text-[10px] font-bold uppercase disabled:opacity-40"
              >
                Confirmar transferencia
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel("Cancelado manualmente por el agente")}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-danger/30 text-danger text-[11px] font-bold uppercase hover:bg-danger/5 disabled:opacity-40"
          >
            <XCircle className="size-3.5" /> Cancelar caso
          </button>
        </div>
      )}
    </div>
  );
}
