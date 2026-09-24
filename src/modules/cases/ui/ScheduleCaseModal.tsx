import { useState, useEffect } from "react";
import { Calendar, Clock, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scheduledAt: string, reminderReason?: string) => Promise<boolean | void>;
  busy?: boolean;
};

/** Formatea una fecha JS a una cadena local utilizable por <input type="datetime-local"> (YYYY-MM-THH:mm). */
function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function ScheduleCaseModal({ open, onOpenChange, onConfirm, busy }: Props) {
  const [scheduledDatetime, setScheduledDatetime] = useState<string>("");
  const [reminderReason, setReminderReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Default: mañana a las 10:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setScheduledDatetime(toLocalDatetimeString(tomorrow));
      setReminderReason("");
      setSubmitting(false);
    }
  }, [open]);

  const applyPreset = (minutesOrDays: { hours?: number; days?: number; setTime?: number }) => {
    const d = new Date();
    if (minutesOrDays.hours) {
      d.setHours(d.getHours() + minutesOrDays.hours);
    } else if (minutesOrDays.days) {
      d.setDate(d.getDate() + minutesOrDays.days);
      if (minutesOrDays.setTime !== undefined) {
        d.setHours(minutesOrDays.setTime, 0, 0, 0);
      }
    }
    setScheduledDatetime(toLocalDatetimeString(d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDatetime) return;

    setSubmitting(true);
    try {
      const dateObj = new Date(scheduledDatetime);
      const isoString = dateObj.toISOString();
      const ok = await onConfirm(isoString, reminderReason.trim() || undefined);
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
            <Clock className="size-5 text-amber-500" />
            Agendar Seguimiento / Poner en Espera
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            El caso pasará al estado "En Espera" y se generará una notificación interna en la fecha seleccionada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Selector de Fecha y Hora */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              Fecha y hora de recordatorio <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                required
                value={scheduledDatetime}
                onChange={(e) => setScheduledDatetime(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Accesos rápidos / Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => applyPreset({ hours: 1 })}
                className="px-2 py-1 rounded-md border border-border bg-card text-[11px] font-semibold hover:bg-foreground/5 transition"
              >
                +1 hora
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ hours: 4 })}
                className="px-2 py-1 rounded-md border border-border bg-card text-[11px] font-semibold hover:bg-foreground/5 transition"
              >
                +4 horas
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ days: 1, setTime: 10 })}
                className="px-2 py-1 rounded-md border border-border bg-card text-[11px] font-semibold hover:bg-foreground/5 transition"
              >
                Mañana 10:00 AM
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ days: 2, setTime: 10 })}
                className="px-2 py-1 rounded-md border border-border bg-card text-[11px] font-semibold hover:bg-foreground/5 transition"
              >
                En 2 días
              </button>
            </div>
          </div>

          {/* Motivo del recordatorio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Motivo del recordatorio <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={reminderReason}
              onChange={(e) => setReminderReason(e.target.value)}
              placeholder="Ej: Verificar calidad de navegación con el cliente tras mantenimiento"
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
              disabled={isLoading || !scheduledDatetime}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-sm hover:brightness-95 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading && <Loader2 className="size-3.5 animate-spin" />}
              Confirmar Agendamiento
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
