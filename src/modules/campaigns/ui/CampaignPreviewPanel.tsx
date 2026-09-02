import React from "react";
import {
  CheckCheck,
  Phone,
  Video,
  Eye,
  CheckCircle2,
  Image,
  FileText,
  ExternalLink,
  CornerDownLeft,
} from "lucide-react";
import type { MessageTemplate } from "@/modules/message-templates/domain/message-template";

type CampaignPreviewPanelProps = {
  messageText: string;
  name?: string;
  selectedTemplate?: MessageTemplate | null;
  variableValues?: Record<string, string>;
};

export const CampaignPreviewPanel: React.FC<CampaignPreviewPanelProps> = ({
  messageText,
  name,
  selectedTemplate,
  variableValues = {},
}) => {
  const formatWhatsAppText = (rawText: string): React.ReactNode[] => {
    if (!rawText || !rawText.trim()) {
      return [
        <span key="empty" className="text-slate-400 italic">
          Tu mensaje aparecerá aquí...
        </span>,
      ];
    }

    // 1. Sustituir variables numeradas {{1}}, {{2}} y variables descriptivas {{name}}, {{number}}, {{body}}
    let processed = rawText;

    // Primero sustitución de variables numeradas con variableValues o fallback visual
    processed = processed.replace(/\{\{(\d+)\}\}/g, (_, varNum) => {
      if (variableValues[varNum] && variableValues[varNum].trim() !== "") {
        return variableValues[varNum];
      }
      return `[Variable ${varNum}]`;
    });

    // Sustitución de nombres amigables
    processed = processed
      .replace(/\{\{name\}\}/gi, variableValues["name"] || "Carlos Pérez")
      .replace(/\{\{nombre\}\}/gi, variableValues["nombre"] || "Carlos Pérez")
      .replace(/\{\{number\}\}/gi, variableValues["number"] || "+57 300 123 4567")
      .replace(/\{\{telefono\}\}/gi, variableValues["telefono"] || "+57 300 123 4567")
      .replace(/\{\{celular\}\}/gi, variableValues["celular"] || "+57 300 123 4567");

    const lines = processed.split("\n");
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~)/g);
      return (
        <React.Fragment key={lineIdx}>
          {parts.map((part, partIdx) => {
            if (part.startsWith("*") && part.endsWith("*")) {
              return <strong key={partIdx}>{part.slice(1, -1)}</strong>;
            }
            if (part.startsWith("_") && part.endsWith("_")) {
              return <em key={partIdx}>{part.slice(1, -1)}</em>;
            }
            if (part.startsWith("~") && part.endsWith("~")) {
              return <del key={partIdx}>{part.slice(1, -1)}</del>;
            }
            // Destacar de manera elegante las variables no reemplazadas aún
            if (part.startsWith("[Variable ") && part.endsWith("]")) {
              return (
                <span
                  key={partIdx}
                  className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-emerald-400/20 text-emerald-200 font-mono text-[11px] border border-emerald-400/30"
                >
                  {part}
                </span>
              );
            }
            return part;
          })}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const currentTime = new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const header = selectedTemplate?.header;
  const footerText = selectedTemplate?.footer;
  const buttons = selectedTemplate?.buttons;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border/80 bg-[#0b141a] overflow-hidden shadow-xl select-none font-sans">
      {/* Header bar WhatsApp Meta */}
      <div className="bg-[#128c7e] text-white px-3.5 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-700/80 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
            <span className="text-white">C</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight text-white">Contacto de ejemplo</span>
            <span className="text-[10px] text-emerald-100 font-medium">en línea</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/80">
          <Video className="w-4 h-4 cursor-pointer hover:text-white" />
          <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Title preview badge con Meta status */}
      <div className="bg-[#1f2c34] px-3 py-1.5 border-b border-white/5 flex items-center justify-between text-[11px] text-[#8696a0]">
        <div className="flex items-center gap-1.5 truncate">
          <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-semibold uppercase tracking-wider text-[10px]">Vista previa</span>
          {name && <span className="truncate text-slate-300 ml-1">({name})</span>}
        </div>
        {selectedTemplate ? (
          <div className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            <span>Plantilla Meta</span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400">Mensaje estándar</span>
        )}
      </div>

      {/* Chat Canvas con Tapiz de WhatsApp */}
      <div
        className="flex-1 p-4 flex flex-col justify-end min-h-[300px] relative overflow-y-auto"
        style={{
          backgroundColor: "#0b141a",
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      >
        {/* Separador de fecha */}
        <div className="self-center my-2 px-3 py-0.5 rounded-md bg-[#182229] text-[10px] text-[#8696a0] font-medium shadow-sm border border-white/5">
          Hoy
        </div>

        {/* Contenedor del Mensaje Saliente */}
        <div className="max-w-[88%] self-end flex flex-col items-end gap-1">
          {/* Bocadillo Principal WhatsApp */}
          <div className="w-full bg-[#005c4b] text-slate-100 rounded-lg rounded-tr-none p-3 text-xs leading-relaxed shadow-md relative border border-emerald-400/20 space-y-2">
            {/* Template Header Component */}
            {header && header.type !== "NONE" && (
              <div className="pb-1 border-b border-emerald-400/20 text-slate-100">
                {header.type === "TEXT" && header.text && (
                  <h5 className="font-bold text-xs text-white">{header.text}</h5>
                )}
                {header.type === "IMAGE" && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-950/40 rounded border border-emerald-500/30 text-emerald-200 text-xs">
                    <Image className="w-4 h-4" />
                    <span>[Imagen Adjunta de Plantilla]</span>
                  </div>
                )}
                {(header.type === "DOCUMENT" || header.type === "VIDEO") && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-950/40 rounded border border-emerald-500/30 text-emerald-200 text-xs">
                    <FileText className="w-4 h-4" />
                    <span>[{header.type === "VIDEO" ? "Video" : "Documento PDF"}]</span>
                  </div>
                )}
              </div>
            )}

            {/* Template Body Component */}
            <div className="whitespace-pre-wrap break-words text-[12.5px] text-slate-50">
              {formatWhatsAppText(messageText)}
            </div>

            {/* Template Footer Component */}
            {footerText && (
              <div className="pt-1 text-[11px] text-emerald-200/70 italic border-t border-emerald-400/10">
                {footerText}
              </div>
            )}

            {/* Marca de tiempo y doble check verde */}
            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-200/70 font-mono">
              <span>{currentTime}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
            </div>
          </div>

          {/* Renderizado de Botones Meta (Quick Reply / Call To Action) */}
          {buttons && buttons.length > 0 && (
            <div className="w-full space-y-1 mt-0.5">
              {buttons.map((btn, idx) => (
                <div
                  key={idx}
                  className="w-full py-2 px-3 bg-[#1f2c34] hover:bg-[#2a3942] text-[#00a884] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm border border-white/5 cursor-pointer transition-colors text-center"
                >
                  {btn.type === "CALL_TO_ACTION" ? (
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <CornerDownLeft className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{btn.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pie descriptivo del panel */}
      <div className="bg-[#1f2c34] p-2.5 text-[10px] text-[#8696a0] text-center border-t border-white/5 leading-tight flex items-center justify-center gap-1.5">
        <span>
          {selectedTemplate
            ? `Plantilla "${selectedTemplate.name}" · ${selectedTemplate.languageLabel || selectedTemplate.language}`
            : "Las variables se sustituyen automáticamente al enviar la campaña."}
        </span>
      </div>
    </div>
  );
};
