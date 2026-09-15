import React, { useState, useEffect } from "react";
import type { QuickReply, CreateQuickReplyPayload } from "@/types/quick-reply";
import { X, Sparkles } from "lucide-react";

export interface QuickReplyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateQuickReplyPayload) => Promise<void>;
  initialData?: QuickReply | null;
  departments: Array<{ id: string; name: string }>;
  currentUserRole: "admin" | "manager" | "agent" | string;
  currentAgentDepartmentId?: string | null;
}

const TEMPLATE_TAGS = [
  { tag: "nombre", label: "Nombre Cliente" },
  { tag: "cedula", label: "Cédula / RUC" },
  { tag: "agente", label: "Nombre Agente" },
  { tag: "telefono", label: "Teléfono WhatsApp" },
  { tag: "departamento", label: "Departamento" },
];

export const QuickReplyFormModal: React.FC<QuickReplyFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  departments,
  currentUserRole,
  currentAgentDepartmentId,
}) => {
  const [shortcut, setShortcut] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isManager = currentUserRole === "manager" || currentUserRole === "supervisor";

  useEffect(() => {
    if (initialData) {
      setShortcut(initialData.shortcut);
      setTitle(initialData.title);
      setBody(initialData.body);
      setCategory(initialData.category ?? "");
      setDepartmentId(initialData.departmentId);
    } else {
      setShortcut("");
      setTitle("");
      setBody("");
      setCategory("");
      setDepartmentId(isManager ? currentAgentDepartmentId ?? null : null);
    }
    setError(null);
  }, [initialData, isOpen, isManager, currentAgentDepartmentId]);

  if (!isOpen) return null;

  const insertVariable = (variable: string) => {
    setBody((prev) => `${prev}{{${variable}}}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const cleanShortcut = shortcut.replace(/^\/+/, "").trim().toLowerCase();
      if (!cleanShortcut) {
        throw new Error("El atajo es requerido y no puede estar vacío");
      }

      await onSave({
        shortcut: cleanShortcut,
        title: title.trim(),
        body: body.trim(),
        category: category.trim() || undefined,
        departmentId: departmentId === "global" ? null : departmentId,
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message || "Ocurrió un error al guardar la respuesta rápida";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground">
              {initialData ? "Editar Respuesta Rápida" : "Nueva Respuesta Rápida"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configura plantillas cortas reutilizables al escribir <code className="font-mono bg-muted px-1 rounded">/atajo</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground">
              Atajo (sin barra "/")
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground font-mono text-sm">
                /
              </span>
              <input
                type="text"
                required
                value={shortcut}
                onChange={(e) =>
                  setShortcut(e.target.value.toLowerCase().replace(/\s+/g, "_"))
                }
                placeholder="ej: saludo, bancos, requisitos"
                className="w-full rounded-lg border border-input bg-background pl-7 pr-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Se autocompleta cuando el agente escribe <code className="font-mono">/{shortcut || "..."}</code> en el chat.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              Título descriptivo
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej: Información de cuentas bancarias"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Ámbito de disponibilidad
              </label>
              <select
                value={departmentId ?? "global"}
                disabled={isManager}
                onChange={(e) =>
                  setDepartmentId(e.target.value === "global" ? null : e.target.value)
                }
                className="mt-1 w-full rounded-lg border border-input bg-background px-2.5 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              >
                {!isManager && (
                  <option value="global">🌐 General (Toda la empresa)</option>
                )}
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    🏢 {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Categoría (opcional)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ej: soporte, pagos"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          {isManager && (
            <p className="text-[11px] text-muted-foreground">
              Como Manager o Supervisor, tus respuestas rápidas quedan asociadas a tu departamento.
            </p>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="size-3 text-primary" />
                Mensaje de la plantilla (con variables)
              </label>
              <div className="flex flex-wrap gap-1">
                {TEMPLATE_TAGS.map(({ tag, label }) => (
                  <button
                    key={tag}
                    type="button"
                    title={`Insertar ${label}`}
                    onClick={() => insertVariable(tag)}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground hover:bg-primary/10 hover:text-primary transition"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hola {{nombre}}, le recordamos que su saldo pendiente es..."
              className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:brightness-95 transition disabled:opacity-50"
            >
              {saving ? "Guardando..." : initialData ? "Actualizar" : "Crear Respuesta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
