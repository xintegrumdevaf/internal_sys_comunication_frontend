import { useState } from "react";
import { Plus, Trash2, Edit3, HelpCircle, Check, X, Tag } from "lucide-react";
import type { FaqItem } from "../types/knowledge.types";

interface FaqDirectEditorProps {
  faqs: FaqItem[];
  onSaveFaq: (
    faq: Omit<FaqItem, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) => Promise<void>;
  onDeleteFaq: (id: string) => Promise<void>;
}

export function FaqDirectEditor({ faqs, onSaveFaq, onDeleteFaq }: FaqDirectEditorProps) {
  const [editingFaq, setEditingFaq] = useState<Partial<FaqItem> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateNew = () => {
    setEditingFaq({
      question: "",
      answer: "",
      category: "Soporte Técnico",
      tags: [],
      variations: [],
      active: true,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq?.question || !editingFaq?.answer) return;

    setLoading(true);
    try {
      await onSaveFaq({
        id: editingFaq.id,
        question: editingFaq.question,
        answer: editingFaq.answer,
        category: editingFaq.category || "General",
        tags: editingFaq.tags || [],
        variations: editingFaq.variations || [],
        active: editingFaq.active ?? true,
      });
      setEditingFaq(null);
    } finally {
      setLoading(false);
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
            Añade respuestas directas que el bot RAG priorizará sobre los documentos extensos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          Nueva Pregunta Frecuente
        </button>
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
                Respuesta Canónica (RAG Prioritaria)
              </label>
              <textarea
                rows={3}
                placeholder="Escribe la respuesta oficial precisa que enviará el agente de IA..."
                value={editingFaq.answer || ""}
                onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Categoría
              </label>
              <select
                value={editingFaq.category || "Soporte Técnico"}
                onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="Soporte Técnico">Soporte Técnico</option>
                <option value="Cartera & Cobros">Cartera & Cobros</option>
                <option value="UTGA & Operaciones">UTGA & Operaciones</option>
                <option value="Políticas Generales">Políticas Generales</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Etiquetas (Separadas por comas)
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
              Guardar FAQ
            </button>
          </div>
        </form>
      )}

      {/* Lista de FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="p-5 border border-border rounded-xl bg-card hover:border-primary/40 transition-colors flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  {faq.category}
                </span>

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
                <Tag className="size-3 text-muted-foreground" />
                {faq.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
