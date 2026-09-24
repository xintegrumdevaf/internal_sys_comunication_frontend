import { useState } from "react";
import { Plus, Trash2, Edit3, HelpCircle, Check, X, Tag, Globe, Building2 } from "lucide-react";
import type { FaqItem } from "../types/knowledge.types";
import type { Department } from "@/types/department";

interface FaqDirectEditorProps {
  faqs: FaqItem[];
  departments?: Department[];
  departmentFilter?: string;
  onDepartmentFilterChange?: (deptId: string) => void;
  onSaveFaq: (
    faq: Omit<FaqItem, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) => Promise<void>;
  onDeleteFaq: (id: string) => Promise<void>;
}

export function FaqDirectEditor({
  faqs,
  departments = [],
  departmentFilter = "all",
  onDepartmentFilterChange,
  onSaveFaq,
  onDeleteFaq,
}: FaqDirectEditorProps) {
  const [editingFaq, setEditingFaq] = useState<Partial<FaqItem> | null>(null);
  const [localDepartmentFilter, setLocalDepartmentFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const effectiveDeptFilter = onDepartmentFilterChange ? departmentFilter : localDepartmentFilter;

  const handleCreateNew = () => {
    setEditingFaq({
      question: "",
      answer: "",
      category: "General",
      isGlobal: true,
      departmentId: departments[0]?.id || null,
      tags: [],
      variations: [],
      active: true,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq?.question || !editingFaq?.answer) return;

    const isGlobal = editingFaq.isGlobal ?? true;
    const departmentId = isGlobal ? null : editingFaq.departmentId || null;
    const selectedDept = departments.find((d) => d.id === departmentId);
    const category = isGlobal
      ? "Políticas Generales"
      : selectedDept?.name || editingFaq.category || "General";

    setLoading(true);
    try {
      await onSaveFaq({
        id: editingFaq.id,
        question: editingFaq.question,
        answer: editingFaq.answer,
        category,
        isGlobal,
        departmentId,
        tags: editingFaq.tags || [],
        variations: editingFaq.variations || [],
        active: editingFaq.active ?? true,
      });
      setEditingFaq(null);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Soporte Técnico":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            {category}
          </span>
        );
      case "Cartera & Cobros":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {category}
          </span>
        );
      case "UTGA & Operaciones":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            {category}
          </span>
        );
      case "Políticas Generales":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {category}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            {category}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Conocimiento Directo & Preguntas Frecuentes
          </h3>
          <p className="text-xs text-muted-foreground">
            Añade respuestas directas que el asistente priorizará para responder con exactitud.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={effectiveDeptFilter}
            onChange={(e) => {
              if (onDepartmentFilterChange) {
                onDepartmentFilterChange(e.target.value);
              } else {
                setLocalDepartmentFilter(e.target.value);
              }
            }}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">Todas las áreas (Global y Depts)</option>
            <option value="global">Solo Globales</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shrink-0"
          >
            <Plus className="size-4" />
            Nueva Pregunta Frecuente
          </button>
        </div>
      </div>

      {/* Formulario de Edición (Si está activo) */}
      {editingFaq && (
        <form
          onSubmit={handleFormSubmit}
          className="p-5 border border-primary/40 rounded-xl bg-card/90 shadow-lg space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="size-4 text-primary" />
              {editingFaq.id ? "Editar Pregunta Frecuente" : "Crear Nueva Pregunta Frecuente"}
            </h4>
            <button
              type="button"
              onClick={() => setEditingFaq(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pregunta Principal / Título
              </label>
              <input
                type="text"
                placeholder="Ej: ¿Cómo consultar el saldo de mi plan?"
                value={editingFaq.question || ""}
                onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Respuesta Oficial del Asistente
              </label>
              <textarea
                rows={3}
                placeholder="Escribe la respuesta oficial precisa que enviará el asistente..."
                value={editingFaq.answer || ""}
                onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Selector de Alcance */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Alcance de la Pregunta Frecuente
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingFaq({
                      ...editingFaq,
                      isGlobal: true,
                      departmentId: null,
                    })
                  }
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-semibold transition-all ${
                    (editingFaq.isGlobal ?? true)
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Globe className="size-4 shrink-0" />
                  Global (Toda la Empresa)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditingFaq({
                      ...editingFaq,
                      isGlobal: false,
                      departmentId: editingFaq.departmentId || departments[0]?.id || null,
                    })
                  }
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-semibold transition-all ${
                    !(editingFaq.isGlobal ?? true)
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Building2 className="size-4 shrink-0" />
                  Por Departamento
                </button>
              </div>
            </div>

            {!(editingFaq.isGlobal ?? true) && (
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Departamento Asignado
                </label>
                <select
                  value={editingFaq.departmentId || ""}
                  onChange={(e) =>
                    setEditingFaq({
                      ...editingFaq,
                      departmentId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={`space-y-1 ${!(editingFaq.isGlobal ?? true) ? "" : "md:col-span-2"}`}>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Etiquetas / Temas Clave (Separadas por comas)
              </label>
              <input
                type="text"
                placeholder="saldo, pago, facturacion"
                value={editingFaq.tags?.join(", ") || ""}
                onChange={(e) =>
                  setEditingFaq({
                    ...editingFaq,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingFaq(null)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Check className="size-4" />
              Guardar Pregunta Frecuente
            </button>
          </div>
        </form>
      )}

      {/* Lista de FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs
          .filter((faq) => {
            if (effectiveDeptFilter === "all") return true;
            if (effectiveDeptFilter === "global") return Boolean(faq.isGlobal);
            return (
              faq.departmentId === effectiveDeptFilter ||
              (!faq.departmentId && !faq.isGlobal && faq.category === effectiveDeptFilter)
            );
          })
          .map((faq) => {
            const isFaqGlobal = faq.isGlobal;
            const deptName =
              faq.departmentName ||
              departments.find((d) => d.id === faq.departmentId)?.name ||
              faq.category ||
              "General";

            return (
              <div
                key={faq.id}
                className="p-5 border border-border rounded-xl bg-card hover:border-primary/40 transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    {isFaqGlobal ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Globe className="size-3" />
                        Global
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        <Building2 className="size-3" />
                        {deptName}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingFaq(faq)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded"
                        title="Editar"
                      >
                        <Edit3 className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteFaq(faq.id)}
                        className="p-1 text-muted-foreground hover:text-rose-400 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-foreground leading-snug">{faq.question}</h4>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>

                {faq.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
                    <Tag className="size-3 text-primary/70" />
                    {faq.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
