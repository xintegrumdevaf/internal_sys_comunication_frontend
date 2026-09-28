import { useState, useEffect } from "react";
import { Clock, Loader2, Tag as TagIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  loadTagsFromStorage,
  createTagInStorage,
} from "@/modules/tags/infrastructure/tags.storage";
import type { TagItem } from "@/modules/tags/domain/tag";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    scheduledAt: string,
    scheduleTag?: string,
    reminderReason?: string,
  ) => Promise<boolean | void>;
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
  const [selectedTag, setSelectedTag] = useState<string>("AGENDADO");
  const [customTag, setCustomTag] = useState<string>("");
  const [reminderReason, setReminderReason] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setScheduledDatetime(toLocalDatetimeString(tomorrow));
      setSelectedTag("AGENDADO");
      setCustomTag("");
      setReminderReason("");
      setSubmitting(false);
      setAvailableTags(loadTagsFromStorage());
    }
  }, [open]);

  // Escuchar eventos de actualización de etiquetas del sistema
  useEffect(() => {
    const handleUpdate = () => {
      setAvailableTags(loadTagsFromStorage());
    };
    window.addEventListener("tags-updated", handleUpdate);
    return () => window.removeEventListener("tags-updated", handleUpdate);
  }, []);

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

    let finalTag = selectedTag;
    if (selectedTag === "OTRO") {
      finalTag = customTag.trim().toUpperCase() || "AGENDADO";
      if (finalTag !== "AGENDADO" && finalTag !== "OTRO") {
        createTagInStorage(finalTag, "#f59e0b", "Etiqueta creada durante agendamiento");
      }
    }

    setSubmitting(true);
    try {
      const dateObj = new Date(scheduledDatetime);
      const isoString = dateObj.toISOString();
      const ok = await onConfirm(isoString, finalTag, reminderReason.trim() || undefined);
      if (ok !== false) {
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = busy || submitting;
  const currentBadgeTag =
    selectedTag === "OTRO"
      ? customTag.trim().toUpperCase() || "NUEVA ETIQUETA"
      : selectedTag;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
            <Clock className="size-5 text-amber-500" />
            Agendar Seguimiento / Poner en Espera
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Selecciona la etiqueta descriptiva del agendamiento. Las etiquetas creadas están sincronizadas con la sección de Etiquetas de la barra lateral.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Selector desplegable de Etiquetas Disponibles */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TagIcon className="size-3.5 text-amber-500" />
                Etiqueta de Agendamiento <span className="text-danger">*</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                🏷️ {currentBadgeTag}
              </span>
            </label>

            <select
              value={selectedTag}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTag(val);
                if (val !== "OTRO") {
                  setCustomTag("");
                }
              }}
              className="w-full text-xs p-3 rounded-xl border border-border bg-background font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <optgroup label="Etiquetas Disponibles del Sistema">
                {availableTags.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} {t.description ? `— ${t.description}` : ""}
                  </option>
                ))}
              </optgroup>

              <optgroup label="Crear Nueva">
                <option value="OTRO">OTRO — Crear nueva etiqueta personalizada...</option>
              </optgroup>
            </select>

            {/* Campo para ingresar nueva etiqueta personalizada */}
            {selectedTag === "OTRO" && (
              <div className="space-y-1 pt-1 animate-fade-in">
                <input
                  type="text"
                  autoFocus
                  required
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Ej: INFORMATIVO-ADMINISTRATIVO"
                  className="w-full text-xs p-3 rounded-xl border border-amber-500/60 bg-background font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  💡 Al guardar, esta etiqueta se registrará automáticamente en la sección de Etiquetas para reutilizarla.
                </p>
              </div>
            )}
          </div>

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

            {/* Accesos rápidos / Presets de fecha */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => applyPreset({ hours: 1 })}
                className="px-2 py-1 rounded-md border border-border bg-card text-[11px] font-semibold hover:bg-foreground/5 transition cursor-pointer"
              >
                +1 hora
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ hours: 4 })}
                className="px-2 py-1 rounded-md border border-border bg-card text-[11px] font-semibold hover:bg-foreground/5 transition cursor-pointer"
              >
                +4 horas
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ days: 1, setTime: 10 })}
                className="px-2 py-1 rounded-md border border-border bg-card text-[11px] font-semibold hover:bg-foreground/5 transition cursor-pointer"
              >
                Mañana 10:00 AM
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ days: 2, setTime: 10 })}
                className="px-2 py-1 rounded-md border border-border bg-card text-[11px] font-semibold hover:bg-foreground/5 transition cursor-pointer"
              >
                En 2 días
              </button>
            </div>
          </div>

          {/* Motivo o Detalle adicional opcional */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Nota / Detalle adicional <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={reminderReason}
              onChange={(e) => setReminderReason(e.target.value)}
              placeholder="Ej: Cliente solicitó probar servicio durante la noche"
              className="w-full text-xs p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-foreground/5 transition disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !scheduledDatetime}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-sm hover:brightness-95 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
