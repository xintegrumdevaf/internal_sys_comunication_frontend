import { CheckCircle2, Clock, ListChecks } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CaseSummaryDto, CaseTimelineEntryDto } from "@/adapters/http/dto";

/**
 * Ventana de resumen de escalación (docs/spec/03_REALTIME_NOTIFICATIONS.md §4).
 * Contenido 100% real de GET /api/cases/:id/summary + /timeline — nada mockeado.
 */
export function CaseSummaryDialog({
  open,
  onOpenChange,
  summary,
  timeline,
  onClaim,
  claimDisabled,
  claimLabel = "Reclamar caso",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: CaseSummaryDto | null;
  timeline: CaseTimelineEntryDto[];
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
            Generado por el backend a partir del historial real del caso — no es un texto
            inventado por la IA.
          </DialogDescription>
        </DialogHeader>

        {!summary ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Cargando resumen…</p>
        ) : (
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
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Problema</p>
                <p className="font-semibold mt-0.5">{summary.problem}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">
                  Departamento
                </p>
                <p className="font-semibold mt-0.5">{summary.department}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Estado</p>
                <p className="font-semibold mt-0.5">{summary.status}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Razón</p>
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
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Object.keys(summary.results ?? {}).length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Resultados
                </h4>
                <div className="rounded-lg border border-border divide-y divide-border text-xs">
                  {Object.entries(summary.results).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-3 px-3 py-1.5">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-mono text-right break-all">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
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
                      <span className="truncate">{entry.action}</span>
                      <span className="text-muted-foreground shrink-0">{entry.status}</span>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
