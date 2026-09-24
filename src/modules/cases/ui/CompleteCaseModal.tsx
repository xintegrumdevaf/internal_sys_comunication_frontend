import { useState, useEffect } from "react";
import { CheckCircle2, UserX, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { CloseReason } from "@/modules/cases/infrastructure/case.gateway";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (closeReason: CloseReason, resolutionNote?: string) => Promise<boolean | void>;
  busy?: boolean;
};

export function CompleteCaseModal({ open, onOpenChange, onConfirm, busy }: Props) {
  const [closeReason, setCloseReason] = useState<CloseReason>("RESOLVED");
  const [resolutionNote, setResolutionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCloseReason("RESOLVED");
      setResolutionNote("");
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onConfirm(closeReason, resolutionNote.trim() || undefined);
      if (ok !== false) {
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = busy || submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
            <CheckCircle2 className="size-5 text-primary" />
            Cerrar / Completar Caso
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Seleccione el motivo de cierre obligatorio para finalizar la atención del caso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              Motivo de cierre <span className="text-danger">*</span>
            </label>
            <div className="space-y-2">
              {/* Opción 1: RESOLVED */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  closeReason === "RESOLVED"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-card hover:bg-foreground/5"
                }`}
              >
                <input
                  type="radio"
                  name="closeReason"
                  value="RESOLVED"
                  checked={closeReason === "RESOLVED"}
                  onChange={() => setCloseReason("RESOLVED")}
                  className="mt-0.5 accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <span className="size-2 rounded-full bg-blue-500 inline-block" />
                    Cierre normal / Resuelto
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    El requerimiento del cliente fue resuelto satisfactoriamente.
                  </p>
                </div>
              </label>

              {/* Opción 2: CLIENT_NO_RESPONSE */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  closeReason === "CLIENT_NO_RESPONSE"
                    ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30"
                    : "border-border bg-card hover:bg-foreground/5"
                }`}
              >
                <input
                  type="radio"
                  name="closeReason"
                  value="CLIENT_NO_RESPONSE"
                  checked={closeReason === "CLIENT_NO_RESPONSE"}
                  onChange={() => setCloseReason("CLIENT_NO_RESPONSE")}
                  className="mt-0.5 accent-amber-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <span className="size-2 rounded-full bg-amber-500 inline-block" />
                    Cierre por falta de respuesta
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    El cliente no respondió tras los mensajes o plantillas de seguimiento enviadas.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Notas de resolución <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Ej: Se brindó solución técnica / cliente no volvió a responder al mensaje de confirmación."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-foreground/5 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:brightness-95 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading && <Loader2 className="size-3.5 animate-spin" />}
              Confirmar Cierre
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
