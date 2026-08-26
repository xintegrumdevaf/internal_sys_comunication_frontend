import { CheckCheck, ExternalLink, Phone, Image as ImageIcon, Video } from "lucide-react";
import type { TemplateComponents } from "../domain/template";
import { substituteVariables } from "../domain/template";

type Props = {
  components: TemplateComponents;
  sampleVariables?: Record<string, string>;
  className?: string;
};

export function WhatsAppBubblePreview({ components, sampleVariables = {}, className = "" }: Props) {
  const { header, body, footer, buttons } = components;

  const renderedBody = substituteVariables(body?.text || "", sampleVariables);

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-[#0b141a] text-slate-100 flex flex-col font-sans select-none ${className}`}
    >
      {/* WhatsApp Header bar */}
      <div className="bg-[#202c33] px-3.5 py-2.5 flex items-center gap-3 border-b border-white/5">
        <div className="size-8 rounded-full bg-[#00a884] text-white grid place-items-center font-bold text-xs">
          WA
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-100 truncate">Vista Previa de WhatsApp</p>
          <p className="text-[10px] text-[#8696a0]">Cuenta Comercial Verificada Meta</p>
        </div>
      </div>

      {/* WhatsApp Chat Body Wallpaper */}
      <div
        className="p-4 flex-1 flex flex-col justify-end bg-repeat relative min-h-[220px]"
        style={{
          backgroundColor: "#0b141a",
          backgroundImage:
            "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      >
        {/* WhatsApp Message Bubble */}
        <div className="max-w-[85%] sm:max-w-[78%] self-start bg-[#005c4b] text-slate-100 rounded-lg rounded-tl-none shadow-md overflow-hidden border border-emerald-400/20 text-xs">
          {/* Header */}
          {header && header.type !== "NONE" && (
            <div className="bg-[#004a3c] p-2.5 border-b border-emerald-400/10">
              {header.type === "TEXT" && (
                <p className="font-bold text-xs text-emerald-100">{header.text || "Encabezado"}</p>
              )}
              {header.type === "IMAGE" && (
                <div className="h-28 rounded bg-[#111b21] flex flex-col items-center justify-center text-slate-400 gap-1 overflow-hidden">
                  {header.mediaUrl ? (
                    <img src={header.mediaUrl} alt="Header" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="size-6 text-emerald-400/60" />
                      <span className="text-[10px]">Imagen de cabecera</span>
                    </>
                  )}
                </div>
              )}
              {header.type === "VIDEO" && (
                <div className="h-28 rounded bg-[#111b21] flex flex-col items-center justify-center text-slate-400 gap-1">
                  <Video className="size-6 text-emerald-400/60" />
                  <span className="text-[10px]">Video de cabecera</span>
                </div>
              )}
            </div>
          )}

          {/* Body Text */}
          <div className="p-3 leading-relaxed whitespace-pre-wrap text-[12.5px] text-slate-50">
            {renderedBody || <span className="italic text-slate-300/60">Escribe el mensaje en la plantilla...</span>}

            {/* Footer text & timestamp */}
            <div className="mt-2 flex items-end justify-between gap-3 text-[10px] text-emerald-200/70 pt-1">
              <span>{footer?.text || ""}</span>
              <span className="flex items-center gap-1 shrink-0 font-mono text-[9px]">
                11:08 AM <CheckCheck className="size-3 text-[#53bdeb]" />
              </span>
            </div>
          </div>

          {/* Interactive WhatsApp Action Buttons */}
          {buttons && buttons.length > 0 && (
            <div className="border-t border-emerald-400/20 divide-y divide-emerald-400/20 bg-[#004e40]">
              {buttons.map((btn, idx) => (
                <div
                  key={idx}
                  className="py-2 px-3 text-center text-emerald-200 hover:bg-emerald-600/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {btn.type === "CALL_TO_ACTION" && btn.ctaType === "URL" && (
                    <ExternalLink className="size-3.5 text-emerald-300" />
                  )}
                  {btn.type === "CALL_TO_ACTION" && btn.ctaType === "PHONE_NUMBER" && (
                    <Phone className="size-3.5 text-emerald-300" />
                  )}
                  <span>{btn.text || `Botón ${idx + 1}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
