import { AlertTriangle, CheckCheck, FileText, Image as ImageIcon, Video, X } from "lucide-react";
import type { MessageTemplate } from "@/modules/message-templates/domain/message-template";
import {
  substituteTemplateVariables,
  templateCategoryLabel,
  templateStatusMeta,
} from "@/modules/message-templates/domain/message-template";

type Props = {
  template: MessageTemplate | null;
  isOpen: boolean;
  onClose: () => void;
};

export function MessageTemplateDetailModal({ template, isOpen, onClose }: Props) {
  if (!isOpen || !template) return null;

  const statusMeta = templateStatusMeta(template.status);
  const renderedBody = substituteTemplateVariables(template.body);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-sm">
              WA
            </div>
            <div>
              <h3 className="text-sm font-extrabold flex items-center gap-2">{template.name}</h3>
              <p className="text-[11px] text-muted-foreground">
                Detalle de Plantilla · Meta WhatsApp Business API
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-lg hover:bg-foreground/10 grid place-items-center text-muted-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Motivo de rechazo de Meta si aplica */}
          {template.status === "REJECTED" && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="size-4 text-rose-500 shrink-0" />
                <span>Plantilla Rechazada por Meta</span>
              </div>
              <p className="text-xs leading-relaxed pl-6">
                {template.rejectedReason ||
                  "Meta no aprobó esta plantilla. Verifica que el contenido cumpla con las políticas de mensajería de WhatsApp, evite spam o lenguaje engañoso y contenga las variables adecuadamente etiquetadas."}
              </p>
            </div>
          )}

          {/* Grid de metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-background border border-border rounded-xl text-xs font-mono">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-sans">
                Categoría
              </span>
              <span className="font-bold text-foreground">
                {templateCategoryLabel(template.category)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-sans">
                Estado Meta
              </span>
              <span
                className={`inline-flex items-center gap-1.5 font-bold ${statusMeta.badgeClass} px-2 py-0.5 rounded-full text-[11px] border`}
              >
                <span className={`size-1.5 rounded-full ${statusMeta.dotClass}`} />
                {statusMeta.label}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-sans">
                Conexión
              </span>
              <span className="font-bold text-foreground truncate block">
                {template.connectionName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-sans">
                Idioma
              </span>
              <span className="font-bold text-foreground">
                {template.languageLabel || template.language}
              </span>
            </div>
          </div>

          {/* Simulación visual de WhatsApp */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
              Vista Previa en Dispositivo
            </h4>
            <div className="rounded-xl border border-border overflow-hidden bg-[#0b141a] p-4 flex justify-center">
              <div className="w-full max-w-md bg-[#005c4b] text-slate-100 rounded-xl rounded-tl-none p-3.5 shadow-lg space-y-2 border border-emerald-400/20 text-xs">
                {template.header && template.header.type !== "NONE" && (
                  <div className="font-bold text-emerald-100 border-b border-emerald-400/20 pb-2 text-xs space-y-1">
                    {template.header.type === "TEXT" && (
                      <div>{template.header.text || "Encabezado"}</div>
                    )}
                    {template.header.type === "IMAGE" && (
                      <div className="rounded-lg overflow-hidden border border-black/10 bg-black/10 flex flex-col items-center justify-center min-h-[90px]">
                        {template.header.mediaUrl ? (
                          <img
                            src={template.header.mediaUrl}
                            alt="Header"
                            className="w-full max-h-40 object-cover"
                          />
                        ) : (
                          <div className="p-2 text-center text-slate-300">
                            <ImageIcon className="size-5 text-emerald-400 mx-auto mb-1" />
                            <span className="text-[10px]">Imagen de encabezado</span>
                          </div>
                        )}
                      </div>
                    )}
                    {template.header.type === "VIDEO" && (
                      <div className="rounded-lg overflow-hidden border border-black/10 bg-black/10 flex flex-col items-center justify-center min-h-[90px]">
                        {template.header.mediaUrl ? (
                          <video
                            src={template.header.mediaUrl}
                            controls
                            className="w-full max-h-40"
                          />
                        ) : (
                          <div className="p-2 text-center text-slate-300">
                            <Video className="size-5 text-emerald-400 mx-auto mb-1" />
                            <span className="text-[10px]">Video de encabezado</span>
                          </div>
                        )}
                      </div>
                    )}
                    {template.header.type === "DOCUMENT" && (
                      <div className="rounded-lg p-2 bg-black/20 border border-emerald-400/20 flex items-center gap-2">
                        <div className="size-7 rounded bg-emerald-500/20 text-emerald-300 grid place-items-center shrink-0">
                          <FileText className="size-4" />
                        </div>
                        <span className="text-[11px] font-bold truncate flex-1">
                          {template.header.mediaUrl
                            ? template.header.mediaUrl.split("/").pop()
                            : "Documento adjunto"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="leading-relaxed whitespace-pre-wrap text-[12.5px] text-slate-50">
                  {renderedBody}
                </div>
                {template.footer && (
                  <div className="text-[10px] text-emerald-200/70 pt-1">{template.footer}</div>
                )}
                <div className="flex justify-end items-center gap-1 text-[9px] text-emerald-200/60 font-mono">
                  <span>11:40 AM</span>
                  <CheckCheck className="size-3 text-[#53bdeb]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-bold uppercase hover:bg-secondary/80 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
