import { useState, useEffect, useMemo } from "react";
import { FileText, Send, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiGet } from "@/shared/http/http-client";

type TemplateItem = {
  id: string;
  name: string;
  category: string;
  status: string;
  bodyText: string;
  language: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    templateName: string,
    languageCode: string,
    parameters: string[],
  ) => Promise<boolean | void>;
  busy?: boolean;
};

export function SendTemplateModal({ open, onOpenChange, onConfirm, busy }: Props) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      apiGet<{ templates?: TemplateItem[]; data?: { templates?: TemplateItem[] } }>(
        "/api/message-templates?status=APPROVED",
      )
        .then((res) => {
          const list =
            (res as { data?: { templates?: TemplateItem[] } })?.data?.templates ||
            (res as { templates?: TemplateItem[] })?.templates ||
            [];
          setTemplates(list);
          if (list.length > 0) {
            setSelectedTemplateName((prev) => prev || list[0]!.name);
          }
        })
        .catch(() => {
          setTemplates([]);
        })
        .finally(() => {
          setLoading(false);
        });
      setParamValues({});
      setSubmitting(false);
    }
  }, [open]);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.name === selectedTemplateName) || null;
  }, [templates, selectedTemplateName]);

  const variableMatches = useMemo(() => {
    if (!selectedTemplate?.bodyText) return [];
    const matches = selectedTemplate.bodyText.match(/\{\{(\d+)\}\}/g) || [];
    return Array.from(new Set(matches)).sort();
  }, [selectedTemplate]);

  const previewBody = useMemo(() => {
    if (!selectedTemplate) return "";
    let text = selectedTemplate.bodyText;
    variableMatches.forEach((v) => {
      const idx = v.replace(/\D/g, "");
      const val = paramValues[idx] || v;
      text = text.replace(new RegExp(v.replace(/([{}])/g, "\\$1"), "g"), val);
    });
    return text;
  }, [selectedTemplate, variableMatches, paramValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setSubmitting(true);
    try {
      const orderedParams = variableMatches.map((v) => {
        const idx = v.replace(/\D/g, "");
        return paramValues[idx] || "";
      });
      const ok = await onConfirm(
        selectedTemplate.name,
        selectedTemplate.language || "es",
        orderedParams,
      );
      if (ok !== false) {
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = busy || submitting || loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle>Enviar Plantilla de WhatsApp</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Reabre la conversación cerrada de 24 horas enviando una plantilla aprobada por Meta.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <p className="text-xs">Cargando plantillas aprobadas...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">No hay plantillas aprobadas disponibles</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  Crea y sincroniza plantillas aprobadas en el módulo de Plantillas de WhatsApp para
                  iniciar conversaciones fuera de la ventana de 24 horas.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Seleccionar Plantilla
                </label>
                <select
                  value={selectedTemplateName}
                  onChange={(e) => {
                    setSelectedTemplateName(e.target.value);
                    setParamValues({});
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {templates.map((t) => (
                    <option key={t.id || t.name} value={t.name}>
                      {t.name} ({t.category} - {t.language})
                    </option>
                  ))}
                </select>
              </div>

              {variableMatches.length > 0 && (
                <div className="space-y-2 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Variables de la plantilla
                  </p>
                  <div className="grid gap-2">
                    {variableMatches.map((v) => {
                      const idx = v.replace(/\D/g, "");
                      return (
                        <div key={v} className="flex items-center gap-2">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-foreground shrink-0">
                            {v}
                          </span>
                          <input
                            type="text"
                            required
                            placeholder={"Valor para variable " + idx}
                            value={paramValues[idx] || ""}
                            onChange={(e) =>
                              setParamValues((prev) => ({ ...prev, [idx]: e.target.value }))
                            }
                            className="flex-1 px-2.5 py-1 text-xs rounded border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedTemplate && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Vista previa del mensaje
                  </label>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-foreground whitespace-pre-wrap leading-relaxed shadow-xs">
                    {previewBody}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || templates.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:brightness-95 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Enviar plantilla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
