import { useState, useEffect, useRef, useMemo } from "react";
import { Clock, Loader2, Tag as TagIcon, Search, ChevronDown, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { loadTagsFromStorage } from "@/modules/tags/infrastructure/tags.storage";
import { getTagColorPreset, type TagItem } from "@/modules/tags/domain/tag";

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
  const [tagSearch, setTagSearch] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reminderReason, setReminderReason] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setScheduledDatetime(toLocalDatetimeString(tomorrow));

      const loaded = loadTagsFromStorage();
      setAvailableTags(loaded);
      const firstTag = loaded[0]?.name ?? "AGENDADO";
      setSelectedTag(firstTag);
      setTagSearch(firstTag);
      setReminderReason("");
      setDropdownOpen(false);
      setSubmitting(false);
    }
  }, [open]);

  // Escuchar eventos de actualización de etiquetas del sistema
  useEffect(() => {
    const handleUpdate = () => {
      const loaded = loadTagsFromStorage();
      setAvailableTags(loaded);
    };
    window.addEventListener("tags-updated", handleUpdate);
    return () => window.removeEventListener("tags-updated", handleUpdate);
  }, []);

  // Clic fuera para cerrar el menú desplegable de etiquetas
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return availableTags;
    return availableTags.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }, [availableTags, tagSearch]);

  const activeTagItem = availableTags.find(
    (t) => t.name.toUpperCase() === selectedTag.toUpperCase(),
  );
  const colorInfo = getTagColorPreset(activeTagItem?.color);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDatetime) return;

    const finalTag = selectedTag.trim().toUpperCase() || "AGENDADO";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
            <Clock className="size-5 text-amber-500" />
            Agendar Seguimiento / Poner en Espera
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Selecciona una de las etiquetas registradas en el sistema. El caso pasará al estado "En Espera" y generará un recordatorio en la fecha indicada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Selector Buscable (Combobox) de Etiquetas Disponibles */}
          <div className="space-y-2 relative" ref={containerRef}>
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TagIcon className="size-3.5 text-amber-500" />
                Etiqueta de Agendamiento <span className="text-danger">*</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border transition ${colorInfo.bgCls} ${colorInfo.textCls} ${colorInfo.borderCls}`}
                style={colorInfo.customStyle}
              >
                🏷️ {selectedTag}
              </span>
            </label>

            <div className="relative">
              <Search className="size-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                role="combobox"
                aria-expanded={dropdownOpen}
                value={dropdownOpen ? tagSearch : selectedTag}
                onChange={(e) => {
                  setTagSearch(e.target.value);
                  setSelectedTag(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => {
                  setTagSearch(selectedTag);
                  setDropdownOpen(true);
                }}
                placeholder="Escribe para buscar o seleccionar etiqueta..."
                className="w-full text-xs pl-9 pr-9 py-2.5 rounded-xl border border-border bg-card font-semibold font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition uppercase"
              />
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="absolute right-2.5 top-2.5 p-0.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <ChevronDown className={`size-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Menú Desplegable con Filtro en Tiempo Real */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto z-50 bg-card border border-border rounded-xl shadow-xl divide-y divide-border/40 animate-fade-down">
                {filteredTags.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground italic">
                    No se encontraron etiquetas que coincidan con "{tagSearch}"
                  </div>
                ) : (
                  filteredTags.map((t) => {
                    const isSelected = selectedTag.toUpperCase() === t.name.toUpperCase();
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTag(t.name);
                          setTagSearch(t.name);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 hover:bg-foreground/5 transition flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected ? "bg-primary/10 font-bold" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className="size-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: t.color || "#64748b" }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-extrabold text-foreground font-mono text-xs block truncate">
                              {t.name}
                            </span>
                            {t.description && (
                              <span className="text-[11px] text-muted-foreground truncate block">
                                {t.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && <Check className="size-4 text-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
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

